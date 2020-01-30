import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { AbstractPermissionDao } from './AbstractPermissionDao';
import { CommentPermissionData, PrimaryResourceQuery, SecondaryResourceQuery } from '../Permission.api';
import { Action, Resource } from '../entity/Permission.entity';
import { getProperties } from '../util/Decorator.util';
import { QueryBuilder } from '../QueryBuilder';

@Injectable()
export class CommentPermissionDao extends AbstractPermissionDao<CommentPermissionData> {
  public async getCommentsByUserIdAndIdeaId(userId: number, ideaId: number): Promise<CommentPermissionData[]> {
    const commentPermissionData: CommentPermissionData[] = await this.findResources(
      new SecondaryResourceQuery(userId, Resource.IDEA, Resource.COMMENT, Action.READ, true)
        .withColumns(getProperties(CommentPermissionData))
        .withExtension(`AND ${QueryBuilder.subDomainQueryAlias}.userIdeaId = :ideaId`)
        .withExtendedParams({ ideaId })
    );
    return plainToClass(CommentPermissionData, commentPermissionData);
  }

  // ToDo: fix a failure with missing org id
  public async checkPermissions(userId: number, action: Action, commentId?: number): Promise<boolean> {
    return this.hasPermission(
      new PrimaryResourceQuery(userId, Resource.COMMENT, action, true).withInstanceId(commentId)
    );
  }
}
