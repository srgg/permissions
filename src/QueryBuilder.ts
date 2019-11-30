const QueryTemplater =  require('query-template');
const assert = require('assert');

export interface UserParams {
    userId: number;
    organizationId?: number | null;
}

export interface DomainParams extends UserParams {
    domain: string;
    action: string;
}

export interface IsPermittedQueryParams extends DomainParams {
    checkOwnership?: boolean;
    instanceId?: number;
}

export interface BuildPermissionListQueryParams extends UserParams {
    columns?: string[];
    query_extension?: string;
    extended_params?: object;
}

export interface BuildAllResourceQueryParams extends DomainParams {
    columns?: string[];
    checkOwnership?: boolean;
    query_extension?: string;
    extended_params?: object;
}

export interface ParametrizedQuery {
    query: string;
    params: any[];
}

export interface QueryBuilderResult {
    raw: string;
    parametrized: ParametrizedQuery;
}

export class QueryBuilder {

    private static buildQuery({sql, addons}, queryParams, buildParams): QueryBuilderResult {
        const qt = new QueryTemplater();
        const processed: any = {};

        for (const item in addons) {
            const addon = addons[item];
            processed[item] = {};
            processed[item].sql = qt.processTemplates({sql: addon.sql.slice(), addons: addons}, buildParams);
            processed[item].options = addon.options;
        }

        const result = qt.processTemplates({sql: sql, addons: processed}, buildParams);
        const parametrized = qt.parametrizeQuery(result, queryParams, 'mysql');
        return { raw: result, parametrized: parametrized};
    }

    public static buildPermissionListQuery({organizationId, userId, columns, query_extension, extended_params}: BuildPermissionListQueryParams): QueryBuilderResult {
        const alias = 'pp';
        if (!columns) {
            columns = [`(calculatePermittedActions(true, GROUP_CONCAT(${alias}.id))) as permitted`,'domain'];
        }

        if (!query_extension) {
            query_extension =
`AND ${alias}.resource_instance IS NULL
 GROUP BY ${alias}.domain`;
        }

        const q = QueryBuilder.buildPermissionListLowLevelQuery({
            userId:userId,
            organizationId: organizationId,
            columns: columns,
            query_extension: query_extension,
            extended_params: extended_params
        });

        return q;
    }

    public static buildReadAllFromSubDomainQuery({organizationId, userId, domain, action,
            columns, checkOwnership, query_extension, extended_params}: BuildAllResourceQueryParams): QueryBuilderResult {

        const domains: string[] = domain.split('.');
        assert(domains.length === 2);

        const primaryDomain = domains[0].toLowerCase();
        const secondaryDomain = domains[1].toLowerCase();

        const alias = 'sub';
        let cols;

        if (columns) {
            const cc: string[] = [];
            columns.forEach((c) => {
                if (c.trim().charAt(0) == '('){
                    // alias must not to be applied to calculated fields
                    cc.push(c)
                } else {
                    cc.push(alias.concat('.', c));
                }
            });

            cols = cc.join(', ');
        } else {
            cols = alias.concat('.*');
        }

        const sq = QueryBuilder.buildAllLowLevelQuery({
            action: 'ACTION-DOES-NOT-MATTER-FOR-LOW-LEVEL-SINCE-IT-IS-NOT-TAKEN-INTO-ACCOUNT',
            userId:userId,
            domain: secondaryDomain,
            organizationId: null /*organization will be checked at the primary domain query */,
            checkOwnership: checkOwnership},
        );

        const q = QueryBuilder.buildReadAllFromDomainQuery({organizationId: organizationId, userId: userId,
            domain: primaryDomain, action: action, columns: ['id', 'permitted'],
            checkOwnership: checkOwnership});

        const allSubResourcesQueryTemplate = {
            sql:
`
SELECT ${cols}
FROM (
SELECT ll.*, concat_ws(',', '${action}',calculatePermittedActions(ll.is_owner, ll.pids)) as permitted
FROM ( SELECT l.* FROM (
${sq.parametrized.query}
) l
-- Limiting sub-domain resources by joining them on permitted primary resources
         JOIN (
-- BEGIN OF a standard READ ALL FROM DOMAIN query: get permitted resources from the primary domain
${q.parametrized.query}

-- END OF a standard READ ALL FROM DOMAIN query: get permitted resources from the primary domain
) pd ON l.ideas_id =  pd.id
) ll
) ${alias} WHERE TRUE != FALSE
        {{query_extension_point}}` ,
            addons: {
                query_extension_point: {
                    options: {propertyName: 'apply_query_extension', propertyValue: true},
                    sql: `${query_extension}`
                },
            }
        };

        const queryParams = {};

        if (extended_params) {
            Object.assign(queryParams, extended_params);
        }

        const dq = QueryBuilder.buildQuery(allSubResourcesQueryTemplate,
            queryParams,
            {apply_query_extension: !!query_extension});

        dq.parametrized.params = sq.parametrized.params.concat(q.parametrized.params).concat(dq.parametrized.params);
        return dq;
    }

    private static getTableNameForDomain(domain: string): string {
        return domain.toLocaleLowerCase();
    }

    static buildIsPermittedQuery({organizationId, userId, domain, action, checkOwnership, instanceId}: IsPermittedQueryParams): QueryBuilderResult {

        const qPids = QueryBuilder.buildPermissionListLowLevelQuery({
            userId:userId,
            organizationId: organizationId,
            columns: ['(GROUP_CONCAT(pp.id)) as id'],
            query_extension:
                `
          AND pp.domain = :domain
          AND (
            -- apply instance filtering, if required
                (pp.resource_instance IS NOT NULL AND pp.resource_instance = :instanceId)
                OR pp.resource_instance IS NULL
            )`,
            extended_params: {domain: domain, instanceId: instanceId}
        });

        const allResourcesQueryTemplate = {
            sql:
`
SELECT 1 as isPermitted FROM (
SELECT ii.*, calculatePermittedActionsOrNull(:action, ii.is_owner, ii.pids) permitted
FROM (
         SELECT
                (
                    {{ownership_filtering}}
                    {{ownership_is_not_applicable}}
                ) is_owner,         
                (
                    ${qPids.raw}
                ) pids
     ) ii
) iii
WHERE iii.permitted IS NOT NULL`,
            addons: {
                ownership_filtering: {
                    options: {propertyName: 'ownershipFilter', propertyValue: true},
                    sql: `SELECT 1 FROM dual
                          WHERE (
                              :instanceId IS NOT NULL
                                  AND EXISTS (
                                      SELECT 1
                                      FROM ${QueryBuilder.getTableNameForDomain(domain)} i
                                      WHERE i.id = :instanceId
                                        AND ((i.owner_uid IS NOT NULL AND i.owner_uid = :userid)
                                                 OR (i.owner_gid IS NOT NULL AND
                                                     EXISTS(
                                                       SELECT 1
                                                       FROM user_groups ur
                                                       WHERE ur.gid = i.owner_gid
                                                         AND ur.uid = :userid
                                                     )
                                                  )
                                            )
                                  )
                              )
                             OR :instanceId IS NULL`
                },
                ownership_is_not_applicable: { // if ownership is not applicable, then each resource will be treated as owned by everyone
                    options: {propertyName: 'ownershipFilter', propertyValue: false},
                    sql: `(0)`
                }
            }
        };

        const queryParams = { userid: userId, domain: domain,
            organizationid: organizationId, instanceId: instanceId, action: action};

        const rq = QueryBuilder.buildQuery(allResourcesQueryTemplate,
            queryParams,
            {ownershipFilter: checkOwnership,
                organizationFilter: organizationId != null});

        return rq;
    }

    private static buildPermissionListLowLevelQuery({organizationId, userId, columns, query_extension, extended_params}: BuildPermissionListQueryParams): QueryBuilderResult {

        const alias = 'pp';
        let cols;

        if (columns) {
            const cc: string[] = [];
            columns.forEach((c) => {
                if (c.trim().charAt(0) == '('){
                    // alias must not to be applied to calculated fields
                    cc.push(c)
                } else {
                    cc.push(alias.concat('.', c));
                }
            });

            cols = cc.join(', ');
        } else {
            cols = alias.concat('.*');
        }

        const permissionListQueryTemplate = {
            sql:
                `SELECT ${cols}
        FROM permissions ${alias}
        WHERE (${alias}.organization_id = :organizationid OR ${alias}.organization_id = 1)
          AND ( -- include only permissions granted to user either directly or by group membership
                    ${alias}.uid = :userid
                OR EXISTS(
                    SELECT 1
                    FROM user_groups ur
                    WHERE ur.gid = ${alias}.gid
                      AND ur.uid = :userid
                )
            )
 {{query_extension_point}}` ,
            addons: {
                query_extension_point: {
                    options: {propertyName: 'apply_query_extension', propertyValue: true},
                    sql: `${query_extension}`
                },
            }};

        const queryParams = { userid: userId, organizationid: organizationId};

        if (extended_params) {
            Object.assign(queryParams, extended_params);
        }

        const q =   QueryBuilder.buildQuery(permissionListQueryTemplate,
            queryParams,
            {apply_query_extension: !!query_extension});

        return q;
    }

    private static buildAllLowLevelQuery({organizationId, userId, domain, checkOwnership}: BuildAllResourceQueryParams): QueryBuilderResult {

        const qPids = QueryBuilder.buildPermissionListLowLevelQuery({
                userId:userId,
                organizationId: organizationId,
                columns: ['(GROUP_CONCAT(pp.id)) as id'],
                query_extension:
`
          AND pp.domain = :domain
          AND (
            -- apply instance filtering, if required
                (pp.resource_instance IS NOT NULL AND pp.resource_instance = i.id)
                OR pp.resource_instance IS NULL
            )`,
                extended_params: {domain: domain}
            });

        const allResourcesQueryTemplate = {
            sql:
                `SELECT i.*,
    (
        {{ownership_filtering}}
        {{ownership_is_not_applicable}}
    ) is_owner,
    (
        ${qPids.raw}
    ) pids
 FROM ${QueryBuilder.getTableNameForDomain(domain)} i
 WHERE
    TRUE != FALSE
    {{organization_filtering}}`,
            addons: {
                ownership_filtering: {
                    options: {propertyName: 'ownershipFilter', propertyValue: true},
                    sql: `(i.owner_uid IS NOT NULL AND i.owner_uid = :userid)
                        OR (i.owner_gid IS NOT NULL AND
                            EXISTS(
                                SELECT 1
                                FROM user_groups ur
                                WHERE ur.gid = i.owner_gid
                                  AND ur.uid = :userid
                            )
                        )`
                },
                ownership_is_not_applicable: { // if ownership is not applicable, then each resource will be treated as owned by everyone
                    options: {propertyName: 'ownershipFilter', propertyValue: false},
                    sql: `(1)`
                },
                organization_filtering: { // if ownership is not applicable, then each resource will be treated as owned by everyone
                    options: {propertyName: 'organizationFilter', propertyValue: true},
                    sql:
                        ` AND (-- apply organization filtering
i.organization_id = :organizationid OR i.organization_id = 1)`
                }
            }
        };

        const queryParams = { userid: userId, domain: domain, organizationid: organizationId};

        const rq = QueryBuilder.buildQuery(allResourcesQueryTemplate,
            queryParams,
            {ownershipFilter: checkOwnership,
                organizationFilter: organizationId != null});


        return rq;

    }

    public static buildReadAllFromDomainQuery({organizationId, userId, domain, action,
                       columns, checkOwnership, query_extension, extended_params}: BuildAllResourceQueryParams): QueryBuilderResult {
        const alias = 'iii';
        let cols;

        if (columns) {
            const cc: string[] = [];
            columns.forEach((c) => {
                if (c.trim().charAt(0) == '('){
                    // alias must not to be applied to calculated fields
                    cc.push(c)
                } else {
                    cc.push(alias.concat('.', c));
                }
            });

            cols = cc.join(', ');
        } else {
            cols = alias.concat('.*');
        }

        const q = QueryBuilder.buildAllLowLevelQuery({
            action: 'ACTION-DOES-NOT-MATTER-FOR-LOW-LEVEL-SINCE-IT-IS-NOT-TAKEN-INTO-ACCOUNT',
            userId:userId,
            domain: domain,
            organizationId: organizationId,
            checkOwnership: checkOwnership},
        );

        const allResourcesQueryTemplate = {
            sql:`SELECT ${cols}
    FROM (
    SELECT ii.*, calculatePermittedActionsOrNull('${action}', ii.is_owner, ii.pids) permitted
    FROM (
        ${q.raw}
     ) ii ) ${alias} WHERE ${alias}.permitted IS NOT NULL
            {{query_extension_point}}` ,
            addons: {
                query_extension_point: {
                    options: {propertyName: 'apply_query_extension', propertyValue: true},
                    sql: `${query_extension}`
                },
            }
        };

        const queryParams = {action: action, userid: userId, domain: domain, organizationid: organizationId};

        if (extended_params) {
            Object.assign(queryParams, extended_params);
        }

        const dq =   QueryBuilder.buildQuery(allResourcesQueryTemplate,
            queryParams,
            {apply_query_extension: !!query_extension});

        return dq;
    }
}

