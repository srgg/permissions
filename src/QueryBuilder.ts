const QueryTemplater =  require('query-template');

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
      WHERE (LOWER(RIGHT(p.single_perm,4)) = '_own' AND i.owner_id = :userid)
         OR LOWER(RIGHT(p.single_perm,4)) <> '_own'
    `;

    public static buildAllResourceQuery(userid: number, resource: string, action: string, checkOwnership: boolean = false, calculateRowLevelePermissions: boolean = false) {
        const allResourcesQueryTemplate = {
            sql:
                `SELECT  i.*
    {{row_level_permissions}}
FROM ${resource.toLowerCase()} i,
     (
        ${QueryBuilder.permissionQuery}
     ) ppp
WHERE 
    exists (
        SELECT 1 FROM DUAL WHERE
            -- apply filtering by organization
            EXISTS( SELECT 1 FROM users u WHERE u.id = :userid AND u.organization_id = i.organization_id)
            
            -- apply instance filtering if required                            
            AND (
                ( ppp.resource_instance IS NOT NULL AND ppp.resource_instance = i.id)
                OR ppp.resource_instance IS NULL
            ) AND (
                -- apply action filtering
                FIND_IN_SET(LCASE(:action), LCASE(ppp.action)) > 0
                
                -- apply ownership filtering if required
                {{ownership_resource_filter}}
    ))`,
            addons: {
                row_level_permissions: {
                    options: {propertyName: 'needRowLevelPermissions', propertyValue: true},
                    sql: ` ,( ${QueryBuilder.rowLevelPermissionQuery} ) permissions`
                },

                ownership_resource_filter: {
                    options: {propertyName: 'ownershipFilter', propertyValue: true},
                    sql: `OR (FIND_IN_SET(LCASE(CONCAT(:action,'_OWN')), LCASE(ppp.action)) > 0 AND i.owner_id = :userid)`
                },

                ownership_permission_filter: {
                    options: {propertyName: 'ownershipFilter', propertyValue: true},
                    sql: `(LOWER(RIGHT(p.single_perm,4)) = '_own' AND i.owner_id = :userid)`
                }
            }
        };

        const qt = new QueryTemplater();
        const sqlQueryAll = qt.processTemplates(allResourcesQueryTemplate,
            {needRowLevelPermissions: calculateRowLevelePermissions, ownershipFilter: checkOwnership});

        return  qt.parametrizeQuery(sqlQueryAll, {action: action, userid: userid, domain: resource}, 'mysql');
    }
};

