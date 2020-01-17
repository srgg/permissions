import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentPermissionDao } from './CommentPermission.dao';
import { GroupPermissionDao } from './GroupPermission.dao';
import { IdeaPermissionDao } from './IdeaPermission.dao';
import { Permission } from '../entity/Permission.entity';
import { User } from '../entity/User.entity';
import { UserIdea } from '../entity/UserIdea.entity';
import { Group } from '../entity/Group.entity';
import { PermissionDao } from './Permission.dao';
import { UserPermissionDao } from './UserPermission.dao';
import { Comment } from '../entity/Comment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Permission, User, Group, UserIdea, Comment])
  ],
  providers: [
    IdeaPermissionDao,
    CommentPermissionDao,
    UserPermissionDao,
    GroupPermissionDao,
    PermissionDao,
  ]
})
export class PermissionModule {}
