import { NotFoundException } from '@nestjs/common';
import { getConnection } from 'typeorm';
import { Action, Resource } from '../entity/Permission.entity';
import {
    ParametrizedQuery,
    PermissionData,
    PermissionsListResourceQuery,
    QueryParam, RelatedResourceQuery,
    UserResultSet
} from '../Permission.api';
import { QueryBuilderAdapter } from '../QueryBuilderAdapter';

export abstract class AbstractPermissionDao<R extends PermissionData> {
  public abstract async checkPermissions(userId: number, action: Action, resourceId?: number): Promise<boolean>;

    protected async findAffectedUsers(resource: Resource, resourceId: number, orgId: number): Promise<number[]> {
      const relatedResourceQuery: RelatedResourceQuery = new RelatedResourceQuery(resource, Action.READ, true)
        .withInstanceId(resourceId)
        .withOrganizationId(orgId);
      const parametrizedQuery: ParametrizedQuery = relatedResourceQuery.prepareQuery();
      const users: UserResultSet[] = await getConnection().query(parametrizedQuery.query, parametrizedQuery.params);
      return users.map(user => user.id);
  }

  protected async hasPermission(query: QueryParam): Promise<boolean> {
    const organizationId: number = await this.retrieveOrganizationId(query.userId);
    const parametrizedQuery: ParametrizedQuery = QueryBuilderAdapter.buildIsPermittedQuery(
      query.withOrganizationId(organizationId)
    );
    const [result] = await getConnection().query(parametrizedQuery.query, parametrizedQuery.params);
    return result !== undefined && result.isPermitted === '1';
  }

  protected async findResources(queryParam: QueryParam | PermissionsListResourceQuery): Promise<R[]> {
    const organizationId: number = await this.retrieveOrganizationId(queryParam.userId);
    const parametrizedQuery: ParametrizedQuery = queryParam.withOrganizationId(organizationId).prepareQuery();
    return getConnection().query(parametrizedQuery.query, parametrizedQuery.params);
  }

  private async retrieveOrganizationId(userId: number): Promise<number> {
    const [organization] = await getConnection().query(`SELECT organizationId FROM user WHERE id = ${userId}`);
    if (!organization || !organization.organizationId) {
      throw new NotFoundException(`Can not find an organization for the user with id ${userId}`);
    }
    return organization.organizationId;
  }
}
