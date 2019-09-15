const QueryTemplater =  require('query-template');

export interface DomainParams {
    userId: number;
    domain: string;
    action: string;
    organizationId?: number | null;
}

export interface IsPermittedQueryParams extends DomainParams {
    checkOwnership?: boolean;
    instanceId?: number;
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

export class QueryBuilder {

    private static buildQuery({sql, addons}, queryParams, buildParams): ParametrizedQuery {
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

    static buildIsPermittedQuery({organizationId, userId, domain, action, checkOwnership, instanceId}: IsPermittedQueryParams): ParametrizedQuery {
        const q = QueryBuilder.buildReadAllFromDomainQuery({organizationId: organizationId, userId: userId,
            domain: domain, action: action, columns: ['id'],
            query_extension: instanceId ? 'AND iii.id = :instanceId' : undefined, extended_params: {instanceId: instanceId},
            checkOwnership: checkOwnership});

        q.query = `SELECT 1 isPermitted FROM DUAL WHERE EXISTS(
  ${q.query}
);`;
        return q;
    }

    public static buildReadAllFromDomainQuery({organizationId, userId, domain, action,
                       columns, checkOwnership, query_extension, extended_params}: BuildAllResourceQueryParams): ParametrizedQuery {
        const alias = 'iii';
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
            sql:`SELECT ${cols}
    FROM (
    SELECT ii.*, calculatePermittedActionsOrNull(:action, ii.is_owner, ii.pids) permitted
    FROM (
         SELECT i.*,
                (
                    {{ownership_filtering}}
                    {{ownership_is_not_applicable}}
                ) is_owner,
                (
                    SELECT GROUP_CONCAT(pp.id) as id
                    FROM permissions pp
                    WHERE pp.resource = :resource
                      AND ( -- include only permissions granted to user either directly or by group membership
                                pp.uid = :userid
                            OR EXISTS(
                                SELECT 1
                                FROM user_groups ur
                                WHERE ur.gid = pp.gid
                                  AND ur.uid = :userid
                            )
                        )
                      AND (
                        -- apply instance filtering, if required
                            (pp.resource_instance IS NOT NULL AND pp.resource_instance = i.id)
                            OR pp.resource_instance IS NULL
                        )
                ) pids
         FROM ${domain.toLowerCase()} i
         WHERE
            TRUE != FALSE
            {{organization_filtering}}
            
     ) ii ) ${alias} WHERE ${alias}.permitted IS NOT NULL
            {{query_extension_point}}` ,
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
                    options: {propertyName: 'ownershipFilter', propertyValue: false },
                    sql: `(1)`
                },
                organization_filtering: { // if ownership is not applicable, then each resource will be treated as owned by everyone
                    options: {propertyName: 'organizationFilter', propertyValue: true },
                    sql:
                        ` AND (-- apply organization filtering
i.organization_id = :organizationid)`
                },
                query_extension_point: {
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
            {ownershipFilter: checkOwnership, apply_query_extension: !!query_extension,
                organizationFilter: organizationId != null});
    }
}

