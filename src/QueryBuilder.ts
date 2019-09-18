const QueryTemplater =  require('query-template');
const assert = require('assert');

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

    public static buildReadAllFromSubDomainQuery({organizationId, userId, domain, action,
            columns, checkOwnership, query_extension, extended_params}: BuildAllResourceQueryParams): ParametrizedQuery {

        const domains: string[] = domain.split('.');
        assert(domains.length === 2);

        const primaryDomain = domains[0].toLowerCase();
        const secondaryDomain = domains[1].toLowerCase();

        const alias = 'lll';
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
${sq.query}
) l
-- Limiting sub-domain resources by joining them on permitted primary resources
         JOIN (
-- BEGIN OF a standard READ ALL FROM DOMAIN query: get permitted resources from the primary domain
${q.query}

-- END OF a standard READ ALL FROM DOMAIN query: get permitted resources from the primary domain
) pd ON l.ideas_id =  pd.id
) ll
) lll`,
            addons: {}
        };

        const dq = QueryBuilder.buildQuery(allSubResourcesQueryTemplate,
            {},
            {});

        dq.params = sq.params.concat(q.params);
        return dq;
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

    private static buildAllLowLevelQuery({organizationId, userId, domain, checkOwnership}: BuildAllResourceQueryParams): ParametrizedQuery {

        const allResourcesQueryTemplate = {
            sql:
                `SELECT i.*,
    (
        {{ownership_filtering}}
        {{ownership_is_not_applicable}}
    ) is_owner,
    (
        SELECT GROUP_CONCAT(pp.id) as id
        FROM permissions pp
        WHERE pp.domain = :domain
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
i.organization_id = :organizationid)`
                }
            }
        };

        const queryParams = { userid: userId, domain: domain, organizationid: organizationId};

        return QueryBuilder.buildQuery(allResourcesQueryTemplate,
            queryParams,
            {ownershipFilter: checkOwnership,
                organizationFilter: organizationId != null});

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
        ${q.query}
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

        dq.params = q.params.concat(dq.params);
        return dq;
    }
}

