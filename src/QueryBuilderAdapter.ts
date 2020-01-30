import { QueryBuilder } from './QueryBuilder';
import { ParametrizedQuery, PermissionsListResourceQuery, QueryParam } from './Permission.api';

export class QueryBuilderAdapter {
    public static buildIsPermittedQuery(params: QueryParam): ParametrizedQuery {
        return QueryBuilder.buildIsPermittedQuery(params).parametrized;
    }

    public static buildPrimaryResourcesQuery(params: QueryParam): ParametrizedQuery {
        return QueryBuilder.buildReadAllFromPrimaryDomainQuery(params).parametrized;
    }

    public static buildSecondaryResourcesQuery(params: QueryParam): ParametrizedQuery {
        return QueryBuilder.buildReadAllFromSubDomainQuery({
            ...params,
            resource: `${params.resource}.${params.subResource}`,
            userId: params.userId
        }).parametrized;
    }

    public static buildPermissionListQuery(params: PermissionsListResourceQuery): ParametrizedQuery {
        return QueryBuilder.buildPermissionListQuery(params).parametrized;
    }

    public static buildRelatedResourceQuery(params: QueryParam): ParametrizedQuery {
        return QueryBuilder.buildAccessListForResourceQuery({
            organizationId: params.organizationId,
            action: params.action,
            checkOwnership: params.checkOwnership,
            columns: params.columns,
            resource: params.resource,
            resourceId: params.resourceId || (() => {
                throw new Error('Missing instance id');
            })()
        }).parametrized;
    }
}
