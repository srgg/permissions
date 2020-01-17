import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { AbstractPermissionDao } from './AbstractPermissionDao';
import { IdeaPermissionData, PrimaryResourceQuery } from '../Permission.api';
import { Action, Resource } from '../entity/Permission.entity';
import { getProperties } from '../util/Decorator.util';
import { QueryBuilder } from '../QueryBuilder';

@Injectable()
export class IdeaPermissionDao extends AbstractPermissionDao<IdeaPermissionData> {
  public async getAllIdeas(userId: number): Promise<IdeaPermissionData[]> {
    const ideaPermissionData: IdeaPermissionData[] = await this.findResources(
      this.createDefaultPrimaryQuery(userId, Action.READ).withColumns(getProperties(IdeaPermissionData))
    );
    return plainToClass(IdeaPermissionData, ideaPermissionData);
  }

  public async getIdeaByUserIdAndIdeaId(userId: number, ideaId: number): Promise<IdeaPermissionData> {
    const ideaPermissionData: IdeaPermissionData[] = await this.findResources(
      this.createDefaultPrimaryQuery(userId, Action.READ)
        .withColumns(getProperties(IdeaPermissionData))
        .withExtension(`AND ${QueryBuilder.primaryDomainQueryAlias}.id = :ideaId`)
        .withExtendedParams({ ideaId })
    );
    const [deserializedIdea] = plainToClass(IdeaPermissionData, ideaPermissionData);
    return deserializedIdea;
  }

  public async findUsersIdsByIdeaId(ideaId: number): Promise<number[]> {
    return this.findAffectedUsers(Resource.IDEA, ideaId);
  }

  public async checkPermissions(userId: number, action: Action, ideaId?: number): Promise<boolean> {
    return this.hasPermission(this.createDefaultPrimaryQuery(userId, action).withInstanceId(ideaId));
  }

  private createDefaultPrimaryQuery(userId: number, action: Action): PrimaryResourceQuery {
    return new PrimaryResourceQuery(userId, Resource.IDEA, action, true);
  }
}
