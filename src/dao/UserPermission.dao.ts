import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { AbstractPermissionDao } from './AbstractPermissionDao';
import { PrimaryResourceQuery, UserPermissionData } from '../Permission.api';
import { Action, Resource } from '../entity/Permission.entity';
import { getProperties } from '../util/Decorator.util';
import { QueryBuilder } from '../QueryBuilder';

@Injectable()
export class UserPermissionDao extends AbstractPermissionDao<UserPermissionData> {
  public async checkPermissions(requesterUserId: number, action: Action, targetUserId?: number): Promise<boolean> {
    return this.hasPermission(
      new PrimaryResourceQuery(requesterUserId, Resource.USER, action, false).withInstanceId(targetUserId)
    );
  }

  public async getAllPermittedTo(userId: number): Promise<UserPermissionData[]> {
    const userPermissionData: UserPermissionData[] = await this.findResources(
      this.createDefaultPrimaryQuery(userId, Action.READ).withColumns(getProperties(UserPermissionData))
    );
    return plainToClass(UserPermissionData, userPermissionData);
  }

  /**
   * Gets a single permitted user
   * @param requesterUserId - admin user who initiated intention to read a particular user resource
   * @param userId - instance id of the user resource requested by admin user
   */
  public async getOnePermittedTo(requesterUserId: number, userId: number): Promise<UserPermissionData> {
    const userPermissionData: UserPermissionData[] = await this.findResources(
      this.createDefaultPrimaryQuery(requesterUserId, Action.READ)
        .withColumns(getProperties(UserPermissionData))
        .withExtension(`AND ${QueryBuilder.primaryDomainQueryAlias}.id = :requestedUserId`)
        .withExtendedParams({ requestedUserId: userId })
    );
    const [deserializedPermissionData] = plainToClass(UserPermissionData, userPermissionData);
    return deserializedPermissionData;
  }

  private createDefaultPrimaryQuery(userId: number, action: Action): PrimaryResourceQuery {
    return new PrimaryResourceQuery(userId, Resource.USER, action, false);
  }
}
