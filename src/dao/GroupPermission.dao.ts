import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { AbstractPermissionDao } from './AbstractPermissionDao';
import { GroupPermissionData, PrimaryResourceQuery } from '../Permission.api';
import { Action, Resource } from '../entity/Permission.entity';
import { getProperties } from '../util/Decorator.util';
import { QueryBuilder } from '../QueryBuilder';

@Injectable()
export class GroupPermissionDao extends AbstractPermissionDao<GroupPermissionData> {
  public async checkPermissions(userId: number, action: Action, groupId?: number): Promise<boolean> {
    return this.hasPermission(new PrimaryResourceQuery(userId, Resource.GROUP, action, false).withInstanceId(groupId));
  }

  public async getAllGroups(userId: number): Promise<GroupPermissionData[]> {
    const groupPermissionData: GroupPermissionData[] = await this.findResources(
      this.createDefaultPrimaryQuery(userId, Action.READ).withColumns(getProperties(GroupPermissionData))
    );
    return plainToClass(GroupPermissionData, groupPermissionData);
  }

  public async getGroupByUserIdAndGroupId(userId: number, groupId: number): Promise<GroupPermissionData[]> {
    const groupPermissionData: GroupPermissionData[] = await this.findResources(
      this.createDefaultPrimaryQuery(userId, Action.READ)
        .withColumns(getProperties(GroupPermissionData))
        .withExtension(`AND ${QueryBuilder.primaryDomainQueryAlias}.id = :groupId`)
        .withExtendedParams({ groupId })
    );
    return plainToClass(GroupPermissionData, groupPermissionData);
  }

  private createDefaultPrimaryQuery(userId: number, action: Action): PrimaryResourceQuery {
    return new PrimaryResourceQuery(userId, Resource.GROUP, action, false);
  }
}
