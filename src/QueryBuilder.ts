const QueryTemplater =  require('query-template');

export interface DomainParams {
    userId: number;
    resource: string;
    action: string;
}

export interface IsPermittedQueryParams extends DomainParams {
}

export interface BuildAllResourceQueryParams extends DomainParams {
    columns?: string[];
    checkOwnership?: boolean;
    withRowPermissions?: boolean;
}

export class QueryBuilder {
    private static permissionQuery: string = `SELECT * FROM permissions pp
          WHERE  pp.resource = :domain
            AND (
              pp.user_id = :userid
              OR EXISTS (
                SELECT 1 FROM user_roles ur
                  WHERE ur.role_id = pp.role_id AND ur.user_id= :userid
              ))`;

    private static rowLevelPermissionQuery: string = `SELECT GROUP_CONCAT(DISTINCT REPLACE(p.single_perm, '_OWN', '')) FROM
        (
            SELECT Trim(SUBSTRING_INDEX(SUBSTRING_INDEX(ppp.action, ',', n.digit+1), ',', -1)) single_perm
            FROM (
                    ${QueryBuilder.permissionQuery} 
                 ) ppp
                 INNER JOIN (SELECT 0 digit UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3  UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6) n
                    ON LENGTH(REPLACE(ppp.action, ',' , '')) <= LENGTH(ppp.action)-n.digit
        ) p
      WHERE
        {{ownership_permission_filter}} 
         LOWER(RIGHT(p.single_perm,4)) <> '_own'`;

    public static buildDomainQuery({userId, resource, action, columns, checkOwnership, withRowPermissions}: BuildAllResourceQueryParams) {
        const alias = 'i';
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

        const instanceOwnershipCondition: string = `(${alias}.owner_id IS NOT NULL AND ${alias}.owner_id = :userid) OR (${alias}.owner_role_id IS NOT NULL AND EXISTS(
                                SELECT 1 FROM user_roles ur
                                WHERE ur.role_id = ${alias}.owner_role_id AND ur.user_id= :userid
                            ))
`;
        const allResourcesQueryTemplate = {
            sql:
                `SELECT  ${cols}
    {{row_level_permissions}}
FROM ${resource.toLowerCase()} ${alias}
WHERE 
    exists (
        ${QueryBuilder.permissionQuery}
            -- apply filtering by organization
            AND EXISTS( SELECT 1 FROM users u WHERE u.id = :userid AND u.organization_id = ${alias}.organization_id)
            
            -- apply instance filtering if required                            
            AND (
                ( pp.resource_instance IS NOT NULL AND pp.resource_instance = i.id)
                OR pp.resource_instance IS NULL
            ) AND (
                -- apply action filtering
                FIND_IN_SET(LCASE(:action), REPLACE(LCASE(pp.action), ' ', '')) > 0
                
                -- apply ownership filtering if required
                {{ownership_resource_filter}})
    )`,
            addons: {
                row_level_permissions: {
                    options: {propertyName: 'needRowLevelPermissions', propertyValue: true},
                    sql: ` ,( ${QueryBuilder.rowLevelPermissionQuery} ) permissions`
                },

                ownership_resource_filter: {
                    options: {propertyName: 'ownershipFilter', propertyValue: true},
                    sql: `OR (FIND_IN_SET(LCASE(CONCAT(:action,'_OWN')), REPLACE(LCASE(pp.action), ' ', '')) > 0 AND (${instanceOwnershipCondition}))`
                },

                ownership_permission_filter: {
                    options: {propertyName: 'ownershipFilter', propertyValue: true},
                    sql: `(LOWER(RIGHT(p.single_perm,4)) = '_own' AND (${instanceOwnershipCondition})) OR `
                }
            }
        };

        return QueryBuilder.buildQuery(allResourcesQueryTemplate,
            {action: action, userid: userId, domain: resource, instanceId: null},
            {needRowLevelPermissions: withRowPermissions, ownershipFilter: checkOwnership});
    }

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

    static buildIsPermittedQuery({userId, resource, action}: IsPermittedQueryParams) {
        const isPermittedQueryTemplate = {
            sql: ` SELECT 1 isPermitted FROM DUAL WHERE EXISTS (
        ${QueryBuilder.permissionQuery}
        AND FIND_IN_SET(LCASE(:action), REPLACE(LCASE(pp.action), ' ', ''))
)`,
            addons: {}
        };

        return QueryBuilder.buildQuery(isPermittedQueryTemplate,
            {action: action, userid: userId, domain: resource},
            {});
    }
}

