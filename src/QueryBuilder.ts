const QueryTemplater =  require('query-template');

export interface DomainParams {
    userId: number;
    domain: string;
    action: string;
    organizationId: number;
}

export interface IsPermittedQueryParams extends DomainParams {
    checkOwnership?: boolean;
    instanceId?: number;
}

export interface BuildAllResourceQueryParams extends DomainParams {
    columns?: string[];
    checkOwnership?: boolean;
    withRowPermissions?: boolean;
    query_extension?: string;
    extended_params?: object;
}

export class QueryBuilder {

    private static buildQuery({sql, addons}, queryParams, buildParams) {
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
        return parametrized;
    }

    static buildIsPermittedQuery({organizationId, userId, domain, action, checkOwnership, instanceId}: IsPermittedQueryParams) {
        const q = QueryBuilder.buildReadAllFromDomainQuery({organizationId: organizationId, userId: userId,
            domain: domain, action: action, columns: ['id'],
            query_extension: instanceId ? 'AND i.id = :instanceId' : undefined, extended_params: {instanceId: instanceId},
            checkOwnership: checkOwnership, withRowPermissions: false});

        q.query = `SELECT 1 isPermitted FROM DUAL WHERE EXISTS(
  ${q.query}
);`;
        return q;
    }

    public static buildReadAllFromDomainQuery({organizationId, userId, domain, action,
                       columns, checkOwnership, withRowPermissions, query_extension, extended_params}: BuildAllResourceQueryParams) {
        const alias = 'ii';
        let cols;

        if (columns) {
            const cc: string[] = [];
            columns.forEach((c) => {
                cc.push(alias.concat('.', c));
            });

            cols = cc.join(', ');
        } else {
            cols = alias.concat('.*');
        }

        const allResourcesQueryTemplate = {
            sql:`
SELECT ${cols}
    {{row_level_permissions}}       
FROM (
         SELECT i.*
              , (
             SELECT GROUP_CONCAT(pp.id) as id
             FROM permissions pp
             WHERE
                pp.resource = :resource
                AND (
                         pp.uid = :userid
                     OR EXISTS(
                                 SELECT 1
                                 FROM user_groups ur
                                 WHERE ur.gid = pp.gid
                                   AND ur.uid = :userid
                             )
                )

               -- do authorization check filtering

               AND ( -- apply instance filtering if required
                     (pp.resource_instance IS NOT NULL AND pp.resource_instance = i.id)
                     OR pp.resource_instance IS NULL)


               AND ( -- apply action filtering
                     (FIND_IN_SET(LCASE(:action), REPLACE(LCASE(pp.action), ' ', '')) > 0)

                    -- apply owner actions, if applicable
                    {{ownership_resource_filter}}
                 )
         ) pids
         FROM ${domain.toLowerCase()} i
         -- apply organization filtering
          WHERE i.organization_id = :organizationid
          {{query_extention_point}}
     ) ${alias}
WHERE ${alias}.pids IS NOT NULL
`,
            addons: {
                row_level_permissions: {
                    options: {propertyName: 'needRowLevelPermissions', propertyValue: true},
                    sql: ` , calcPermissions(${alias}.pids) as permissions`
                },
                ownership_resource_filter: {
                    options: {propertyName: 'ownershipFilter', propertyValue: true},
                    sql: `OR ( 
                         (
                                 (  -- if owner is provided
                                     (i.owner_uid IS NOT NULL AND i.owner_uid = :userid)
                                     OR (i.owner_gid IS NOT NULL AND pp.gid = i.owner_gid)

                                 )
                                 AND -- apply _OWN actions, if any
                                 FIND_IN_SET(LCASE(CONCAT(:action, '_OWN')),
                                             REPLACE(LCASE(pp.action), ' ', '')) > 0
                             )
                         )`
                },
                query_extention_point: {
                    options: {propertyName: 'apply_query_extension', propertyValue: true},
                    sql: `${query_extension}`
                },
            }
        };

        const queryParams = {action: action, userid: userId, resource: domain, organizationid: organizationId};

        if (extended_params) {
            Object.assign(queryParams, extended_params);
        }

        return QueryBuilder.buildQuery(allResourcesQueryTemplate,
            queryParams,
            {needRowLevelPermissions: withRowPermissions, ownershipFilter: checkOwnership, apply_query_extension: !!query_extension});
    }
}

