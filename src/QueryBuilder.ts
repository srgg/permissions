import * as assert from 'assert';
import * as QueryTemplater from 'query-template';

export interface UserParams {
  userId: number;
  organizationId?: number | null;
}

export interface DomainParams extends UserParams {
  resource: string;
  action: string;
}

export interface IsPermittedQueryParams extends DomainParams {
  checkOwnership?: boolean;
  instanceId?: number;
}

export interface BuildPermissionListQueryParams extends UserParams {
  columns?: string[];
  queryExtension?: string;
  extendedParams?: object;
}

export interface BuildAllResourceQueryParams extends DomainParams {
  columns?: string[];
  checkOwnership?: boolean;
  queryExtension?: string;
  extendedParams?: object;
}

export interface ParametrizedQuery {
  query: string;
  params: any[];
}

export interface QueryBuilderResult {
  raw: string;
  parametrized: ParametrizedQuery;
}

export interface QueryTemplateAddon {
  sql: string;
  options: object;
}

export class QueryBuilder {
  public static readonly primaryDomainQueryAlias: string = 'prime';
  public static readonly subDomainQueryAlias: string = 'sub';

  public static buildIsPermittedQuery({
                                        organizationId,
                                        userId,
                                        resource,
                                        action,
                                        checkOwnership,
                                        instanceId
                                      }: IsPermittedQueryParams): QueryBuilderResult {
    const queryPids: QueryBuilderResult = QueryBuilder.buildPermissionListLowLevelQuery({
      columns: ['(GROUP_CONCAT(pp.id)) as id'],
      extendedParams: { resource, instanceId },
      organizationId,
      queryExtension: `
          AND pp.resource = :resource
          AND (
            -- apply instance filtering, if required
                (pp.resourceId IS NOT NULL AND pp.resourceId = :instanceId)
                OR pp.resourceId IS NULL
            )`,
      userId
    });

    const allResourcesQueryTemplate = {
      addons: {
        organization_filtering: {
          options: { propertyName: 'organizationFilter', propertyValue: true },
          sql: `-- check organization consistency
                        AND ((SELECT organizationId FROM \`${resource.toLocaleLowerCase()}\` WHERE id = :instanceId) IN (1, :organizationId))`
        },
        ownership_filtering: {
          options: { propertyName: 'ownershipFilter', propertyValue: true },
          sql: `SELECT 1 FROM dual
                          WHERE (
                              :instanceId IS NOT NULL
                                  AND EXISTS (
                                      SELECT 1
                                      FROM ${resource.toLocaleLowerCase()} i
                                      WHERE i.id = :instanceId
                                        AND ((i.ownerUserId IS NOT NULL AND i.ownerUserId = :userId)
                                                 OR (i.ownerGroupId IS NOT NULL AND
                                                     EXISTS(
                                                       SELECT 1
                                                       FROM users_groups ur
                                                       WHERE ur.groupId = i.ownerGroupId
                                                         AND ur.userId = :userId
                                                     )
                                                  )
                                            )
                                  )
                              )
                             OR :instanceId IS NULL`
        },
        ownership_is_not_applicable: {
          // if ownership is not applicable, then each resource will be treated as owned by everyone
          options: { propertyName: 'ownershipFilter', propertyValue: false },
          sql: `-- ownership is not applicable
                    (0)`
        }
      },
      sql: `
SELECT 1 as isPermitted FROM (
SELECT ii.*, calculatePermittedActionsOrNull(:action, ii.is_owner, ii.pids) permitted
FROM (
         SELECT
                (
                    {{ownership_filtering}}
                    {{ownership_is_not_applicable}}
                ) is_owner,
                (
                    ${queryPids.raw}
                ) pids
     ) ii
) iii
WHERE iii.permitted IS NOT NULL {{organization_filtering}}`
    };

    const queryParams: object = { userId, resource, organizationId, instanceId, action };

    return QueryBuilder.buildQuery(allResourcesQueryTemplate, queryParams, {
      organizationFilter: organizationId != null && instanceId != null,
      ownershipFilter: checkOwnership
    });
  }

  public static buildPermissionListQuery({
                                           organizationId,
                                           userId,
                                           columns,
                                           queryExtension,
                                           extendedParams
                                         }: BuildPermissionListQueryParams): QueryBuilderResult {
    const alias: string = 'pp';

    if (!queryExtension && !columns) {
      queryExtension = `AND ${alias}.resourceId IS NULL GROUP BY ${alias}.resource`;
    }

    if (!columns) {
      columns = [`(calculatePermittedActions(true, GROUP_CONCAT(${alias}.id))) as permitted`, 'resource'];
    }

    return QueryBuilder.buildPermissionListLowLevelQuery({
      columns,
      extendedParams,
      organizationId,
      queryExtension,
      userId
    });
  }

  public static buildReadAllFromSubDomainQuery({
                                                 organizationId,
                                                 userId,
                                                 resource,
                                                 action,
                                                 columns,
                                                 checkOwnership,
                                                 queryExtension,
                                                 extendedParams
                                               }: BuildAllResourceQueryParams): QueryBuilderResult {
    const resources: string[] = resource.split('.');
    assert(resources.length === 2);

    const primaryResource: string = resources[0].toLowerCase();
    const secondaryResource: string = resources[1].toLowerCase();
    const preparedColumns: string = this.prepareColumns(columns, QueryBuilder.subDomainQueryAlias);

    const lowLevelQuery: QueryBuilderResult = QueryBuilder.buildAllLowLevelQuery({
      action: 'ACTION-DOES-NOT-MATTER-FOR-LOW-LEVEL-SINCE-IT-IS-NOT-TAKEN-INTO-ACCOUNT',
      checkOwnership,
      organizationId: null /*organization will be checked at the primary resource query */,
      resource: secondaryResource,
      userId
    });

    const primaryDomainQuery: QueryBuilderResult = QueryBuilder.buildReadAllFromPrimaryDomainQuery({
      action,
      checkOwnership,
      columns: ['id', 'permitted'],
      organizationId,
      resource: primaryResource,
      userId
    });

    const allSubResourcesQueryTemplate = {
      addons: {
        query_extension_point: {
          options: { propertyName: 'apply_query_extension', propertyValue: true },
          sql: `${queryExtension}`
        }
      },
      sql: `
SELECT ${preparedColumns}
FROM (
SELECT ll.*, concat_ws(',', '${action}',calculatePermittedActions(ll.is_owner, ll.pids)) as permitted
FROM ( SELECT l.* FROM (
${lowLevelQuery.parametrized.query}
) l
-- Limiting sub-resource resources by joining them on permitted primary resources
         JOIN (
-- BEGIN OF a standard READ ALL FROM DOMAIN query: get permitted resources from the primary resource
${primaryDomainQuery.parametrized.query}
-- END OF a standard READ ALL FROM DOMAIN query: get permitted resources from the primary resource
) pd ON l.userIdeaId = pd.id
) ll
) ${QueryBuilder.subDomainQueryAlias} WHERE TRUE != FALSE
        {{query_extension_point}}`
    };

    const queryParams: object = {};

    if (extendedParams) {
      Object.assign(queryParams, extendedParams);
    }

    const finalQuery: QueryBuilderResult = QueryBuilder.buildQuery(allSubResourcesQueryTemplate, queryParams, {
      apply_query_extension: !!queryExtension
    });

    finalQuery.parametrized.params = lowLevelQuery.parametrized.params
      .concat(primaryDomainQuery.parametrized.params)
      .concat(finalQuery.parametrized.params);
    return finalQuery;
  }

  public static buildReadAllFromPrimaryDomainQuery({
                                                     organizationId,
                                                     userId,
                                                     resource,
                                                     action,
                                                     columns,
                                                     checkOwnership,
                                                     queryExtension,
                                                     extendedParams
                                                   }: BuildAllResourceQueryParams): QueryBuilderResult {
    const preparedColumns: string = this.prepareColumns(columns, QueryBuilder.primaryDomainQueryAlias);

    const lowLevelQuery: QueryBuilderResult = QueryBuilder.buildAllLowLevelQuery({
      action: 'ACTION-DOES-NOT-MATTER-FOR-LOW-LEVEL-SINCE-IT-IS-NOT-TAKEN-INTO-ACCOUNT',
      checkOwnership,
      organizationId,
      resource,
      userId
    });

    const allResourcesQueryTemplate = {
      addons: {
        query_extension_point: {
          options: { propertyName: 'apply_query_extension', propertyValue: true },
          sql: `${queryExtension}`
        }
      },
      sql: `SELECT ${preparedColumns}
    FROM (
    SELECT ii.*, calculatePermittedActionsOrNull('${action}', ii.is_owner, ii.pids) permitted
    FROM (
        ${lowLevelQuery.raw}
     ) ii ) ${QueryBuilder.primaryDomainQueryAlias} WHERE ${QueryBuilder.primaryDomainQueryAlias}.permitted IS NOT NULL
            {{query_extension_point}}`
    };

    const queryParams: object = { action, userId, resource, organizationId };

    if (extendedParams) {
      Object.assign(queryParams, extendedParams);
    }

    return QueryBuilder.buildQuery(allResourcesQueryTemplate, queryParams, {
      apply_query_extension: !!queryExtension
    });
  }

  private static buildAllLowLevelQuery({
                                         organizationId,
                                         userId,
                                         resource,
                                         checkOwnership
                                       }: BuildAllResourceQueryParams): QueryBuilderResult {
    const qPids: QueryBuilderResult = QueryBuilder.buildPermissionListLowLevelQuery({
      columns: ['(GROUP_CONCAT(pp.id)) as id'],
      extendedParams: { resource },
      organizationId,
      queryExtension: `
          AND pp.resource = :resource
          AND (
            -- apply instance filtering, if required
                (pp.resourceId IS NOT NULL AND pp.resourceId = i.id)
                OR pp.resourceId IS NULL
            )`,
      userId
    });

    const allResourcesQueryTemplate = {
      addons: {
        organization_filtering: {
          // if ownership is not applicable, then each resource will be treated as owned by everyone
          options: { propertyName: 'organizationFilter', propertyValue: true },
          sql: ` AND (-- apply organization filtering
i.organizationId = :organizationId OR i.organizationId = 1)`
        },
        ownership_filtering: {
          options: { propertyName: 'ownershipFilter', propertyValue: true },
          sql: `(i.ownerUserId IS NOT NULL AND i.ownerUserId = :userId)
                        OR (i.ownerGroupId IS NOT NULL AND
                            EXISTS(
                                SELECT 1
                                FROM users_groups ur
                                WHERE ur.groupId = i.ownerGroupId
                                  AND ur.userId = :userId
                            )
                        )`
        },
        ownership_is_not_applicable: {
          // if ownership is not applicable, then each resource will be treated as owned by everyone
          options: { propertyName: 'ownershipFilter', propertyValue: false },
          sql: '(1)'
        }
      },
      sql: `SELECT i.*,
    (
        {{ownership_filtering}}
        {{ownership_is_not_applicable}}
    ) is_owner,
    (
        ${qPids.raw}
    ) pids
 FROM \`${resource.toLocaleLowerCase()}\` i
 WHERE
    TRUE != FALSE
    {{organization_filtering}}`
    };

    const queryParams: object = { userId, resource, organizationId };

    return QueryBuilder.buildQuery(allResourcesQueryTemplate, queryParams, {
      organizationFilter: organizationId != null,
      ownershipFilter: checkOwnership
    });
  }

  private static buildPermissionListLowLevelQuery({
                                                    organizationId,
                                                    userId,
                                                    columns,
                                                    queryExtension,
                                                    extendedParams
                                                  }: BuildPermissionListQueryParams): QueryBuilderResult {
    const alias: string = 'pp';
    const preparedColumns: string = this.prepareColumns(columns, alias);

    const permissionListQueryTemplate = {
      addons: {
        query_extension_point: {
          options: { propertyName: 'apply_query_extension', propertyValue: true },
          sql: `${queryExtension}`
        }
      },
      sql: `SELECT ${preparedColumns}
        FROM permission ${alias}
        WHERE (${alias}.organizationId = :organizationId OR ${alias}.organizationId = 1)
          AND ( -- include only permission granted to user either directly or by group membership
                    ${alias}.userId = :userId
                OR EXISTS(
                    SELECT 1
                    FROM users_groups ur
                    WHERE ur.groupId = ${alias}.groupId
                      AND ur.userId = :userId
                )
            )
 {{query_extension_point}}`
    };

    const queryParams: object = { userId, organizationId };

    if (extendedParams) {
      Object.assign(queryParams, extendedParams);
    }

    return QueryBuilder.buildQuery(permissionListQueryTemplate, queryParams, {
      apply_query_extension: !!queryExtension
    });
  }

  private static buildQuery({ sql, addons }, queryParams, buildParams): QueryBuilderResult {
    const queryTemplater: QueryTemplater = new QueryTemplater();
    const processedItem: object = {};

    for (const item in addons) {
      if (addons.hasOwnProperty(item)) {
        const addon: QueryTemplateAddon = addons[item];
        processedItem[item] = {};
        processedItem[item].sql = queryTemplater.processTemplates({ sql: addon.sql.slice(), addons }, buildParams);
        processedItem[item].options = addon.options;
      }
    }

    const templateResult: string = queryTemplater.processTemplates({ sql, addons: processedItem }, buildParams);
    const parametrized: ParametrizedQuery = queryTemplater.parametrizeQuery(templateResult, queryParams, 'mysql');
    return { raw: templateResult, parametrized };
  }

  private static prepareColumns(columns: string[] | undefined, alias: string): string {
    return columns
      ? columns.map(column => (column.trim().charAt(0) === '(' ? column : alias.concat('.', column))).join(', ')
      : alias.concat('.*');
  }
}
