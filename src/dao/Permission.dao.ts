import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { getConnection } from 'typeorm';
import { AbstractPermissionDao } from './AbstractPermissionDao';
import { Action, Permission, Resource } from '../entity/Permission.entity';
import { getProperties } from '../util/Decorator.util';
import { PermissionsData, PermissionsListResourceQuery, PrimaryResourceQuery } from '../Permission.api';

@Injectable()
export class PermissionDao extends AbstractPermissionDao<PermissionsData> {
  public async save(permission: Permission): Promise<void> {
    await getConnection()
      .getRepository(Permission)
      .save(permission);
  }

  public async findAllByUserId(userId: number): Promise<PermissionsData[]> {
    const permissionData: PermissionsData[] = await this.findResources(
      new PermissionsListResourceQuery(userId).withColumns(getProperties(PermissionsData))
    );
    return plainToClass(PermissionsData, permissionData);
  }

  public async findById(id: number): Promise<Permission | undefined> {
    return getConnection()
      .getRepository(Permission)
      .findOne({ id });
  }

  public async getAllPermittedByUserId(userId: number): Promise<PermissionsData[]> {
    const permissionData: PermissionsData[] = await this.findResources(
      this.createDefaultPrimaryQuery(userId, Action.READ).withColumns(getProperties(PermissionsData))
    );
    return plainToClass(PermissionsData, permissionData);
  }

  public async getAllPermittedByUserIdAndPermissionId(
    userId: number,
    permissionId: number
  ): Promise<PermissionsData[]> {
    const permissionsData: PermissionsData[] = await this.findResources(
      this.createDefaultPrimaryQuery(userId, Action.READ)
        .withInstanceId(permissionId)
        .withColumns(getProperties(PermissionsData))
    );
    return plainToClass(PermissionsData, permissionsData);
  }

  public async delete(permissionIds: number[]): Promise<void> {
    await getConnection()
      .getRepository(Permission)
      .delete(permissionIds);
  }

  public async checkPermissions(userId: number, action: Action, permissionId?: number): Promise<boolean> {
    return this.hasPermission(this.createDefaultPrimaryQuery(userId, action).withInstanceId(permissionId));
  }

  private createDefaultPrimaryQuery(userId: number, action: Action): PrimaryResourceQuery {
    return new PrimaryResourceQuery(userId, Resource.PERMISSION, action, false);
  }
}
