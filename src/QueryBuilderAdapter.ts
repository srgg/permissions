import { QueryBuilder } from './QueryBuilder';
import { ParametrizedQuery, PermissionsListResourceQuery, QueryParam } from './Permission.api';
import { Resource } from './entity/Permission.entity';

export class QueryBuilderAdapter {
  public static buildIsPermittedQuery(query: QueryParam): ParametrizedQuery {
    return QueryBuilder.buildIsPermittedQuery(query).parametrized;
  }

  public static buildPrimaryResourcesQuery(query: QueryParam): ParametrizedQuery {
    return QueryBuilder.buildReadAllFromPrimaryDomainQuery(query).parametrized;
  }

  public static buildSecondaryResourcesQuery(query: QueryParam): ParametrizedQuery {
    return QueryBuilder.buildReadAllFromSubDomainQuery({ ...query, resource: `${query.resource}.${query.subResource}` })
      .parametrized;
  }

  public static buildPermissionListQuery(query: PermissionsListResourceQuery): ParametrizedQuery {
    return QueryBuilder.buildPermissionListQuery(query).parametrized;
  }

  public static buildRelatedResourceQuery(resource: Resource, resourceId: number): string {
    return `SELECT p.userId
                    FROM permission p
                    WHERE p.resource = '${resource}' and p.resourceId = ${resourceId} and p.userId is not null union
            SELECT ug.userId
                    FROM permission p join users_groups ug on p.groupId = ug.groupId
                    WHERE p.resource = '${resource}' and p.resourceId = ${resourceId} and p.groupId is not null union
            SELECT ui.ownerUserId
                    FROM ${resource} ui
                    WHERE id = ${resourceId} and ui.ownerUserId is not null union
            SELECT ug.userId
                    FROM ${resource} ui join users_groups ug on ui.ownerGroupId = ug.groupId
                    WHERE ui.id = ${resourceId} and ui.ownerGroupId is not null;`;
  }
}
