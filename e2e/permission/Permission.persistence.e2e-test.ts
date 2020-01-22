import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as _ from 'lodash';
import { MorganModule } from 'nest-morgan';
import * as path from 'path';
import { Connection, getConnection } from 'typeorm';
import { Comment } from '../../src/entity/Comment.entity';
import { GroupDto } from '../../src/dto/Group.dto';
import { BuiltInGroupType, Group } from '../../src/entity/Group.entity';
import { UserIdea } from '../../src/entity/UserIdea.entity';
import { Organization } from '../../src/entity/Organization.entity';
import {
  CommentPermissionData,
  GroupPermissionData,
  IdeaPermissionData,
  PermissionsData,
  UserPermissionData
} from '../../src/Permission.api';
import { CommentPermissionDao } from '../../src/dao/CommentPermission.dao';
import { GroupPermissionDao } from '../../src/dao/GroupPermission.dao';
import { IdeaPermissionDao } from '../../src/dao/IdeaPermission.dao';
import { PermissionDao } from '../../src/dao/Permission.dao';
import { Action, Permission } from '../../src/entity/Permission.entity';
import { PermissionModule } from '../../src/dao/Permission.module';
import { UserPermissionDao } from '../../src/dao/UserPermission.dao';
import {
  CHARSET,
  initDB,
  logger
} from '../../src/Constants';
import { User } from '../../src/entity/User.entity';
import { builtInGroups } from '../index';

describe('Permission Tests', () => {
  const testDataPath: string = 'mysql/test-data.sql';
  type IdeaPermissionCheck = (resource: IdeaPermissionData) => boolean;
  type CommentPermissionCheck = (resource: CommentPermissionData) => boolean;

  let app: INestApplication;
  let ideaPermissionDao: IdeaPermissionDao;
  let commentPermissionDao: CommentPermissionDao;
  let userPermissionDao: UserPermissionDao;
  let groupPermissionDao: GroupPermissionDao;
  let permissionDao: PermissionDao;

  beforeAll(async () => {
    const m = await Test.createTestingModule({
      imports: [
        MorganModule.forRoot(),
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: 'localhost',
          port: 3309,
          username: 'user',
          password: 'user',
          database: 'dbTest',
          entities: [Permission, User, UserIdea, Comment, Group, Organization],
          logging: false,
          multipleStatements: true,
          synchronize: false
        }),
        PermissionModule
      ]
    }).compile();

    ideaPermissionDao = m.get<IdeaPermissionDao>(IdeaPermissionDao);
    commentPermissionDao = m.get<CommentPermissionDao>(CommentPermissionDao);
    userPermissionDao = m.get<UserPermissionDao>(UserPermissionDao);
    groupPermissionDao = m.get<GroupPermissionDao>(GroupPermissionDao);
    permissionDao = m.get<PermissionDao>(PermissionDao);

    app = await m.createNestApplication().init();
    await initTestData();
  });

  afterAll(async () => {
    const conn: Connection = await getConnection();
    await conn.close();
  });

  test.each([
    [1, Action.READ_OWN, 1],
    [1, Action.CREATE, 1],
    [1, Action.EDIT_OWN, 1],
    [1, Action.READ_COMMENT_OWN, 1],
    [1, Action.CREATE_COMMENT_OWN, 1]
  ])(
    'User #%d (org = 2) with group "user inventor" should have %s permission for own idea #%d (org = 2)',
    async (...args: Array<number | Action>): Promise<void> => {
      const isPermitted: boolean = await ideaPermissionDao.checkPermissions(
        args[0] as number,
        args[1] as Action,
        args[2] as number
      );
      expect(isPermitted).toBe(true);
    }
  );

  test.each([[1, 1], [2, 4]])(
    'User #%d (org = 2) with group "user inventor" should not be able to DELETE own idea #%d (org = 2)',
    async (userId: number, ideaId: number): Promise<void> => {
      const isPermitted: boolean = await ideaPermissionDao.checkPermissions(userId, Action.DELETE, ideaId);
      expect(isPermitted).toBe(false);
    }
  );

  test.each([[4, Action.READ, 1], [4, Action.CREATE, 1], [4, Action.EDIT, 1], [4, Action.DELETE, 1]])(
    'User #%d (org = 3) with group \'user inventor\' should have no %s permission for others\' idea #%d (org = 2)',
    async (...args: Array<number | Action>): Promise<void> => {
      const isPermitted: boolean = await ideaPermissionDao.checkPermissions(
        args[0] as number,
        args[1] as Action,
        args[2] as number
      );
      expect(isPermitted).toBe(false);
    }
  );

  test.each([
    [11, BuiltInGroupType.INVENTOR_SHARED, Action.READ, 5],
    [11, BuiltInGroupType.INVENTOR_SHARED, Action.EDIT, 5],
    [6, BuiltInGroupType.REVIEWER, Action.READ, 5],
    [11, BuiltInGroupType.INVENTOR_SHARED, Action.READ, 6],
    [11, BuiltInGroupType.INVENTOR_SHARED, Action.EDIT, 6],
    [6, BuiltInGroupType.REVIEWER, Action.READ, 6]
  ])(
    'User #%d (org = 2) with group "%s" should have %s permission for shared idea #%d (org = 2)',
    async (...args: Array<number | BuiltInGroupType | Action>): Promise<void> => {
      const isPermitted: boolean = await ideaPermissionDao.checkPermissions(
        args[0] as number,
        args[2] as Action,
        args[3] as number
      );
      expect(isPermitted).toBe(true);
    }
  );

  test.each([[1, 2, [5, 6]], [6, 2, [5, 6]], [4, 3, [7]], [7, 3, [7]]])(
    'User #%d (org = %d) with group "user inventor" / "reviewer" should be able to READ own and shared to "inventor shared" / "reviewer" group ideas: [%s]',
    async (...args: Array<number | number[]>): Promise<void> => {
      const userId: number = args[0] as number;
      const organizationId: number = args[1] as number;
      const sharedIdeas: number[] = args[2] as number[];

      const inventorGroupId: number = 1;
      const inventorManagerGroupId: number = 2;
      const domain: string = `@org${organizationId}`;

      const permissionData: IdeaPermissionData[] = await ideaPermissionDao.getAllIdeas(userId);

      const hasDomain: IdeaPermissionCheck = resource => resource.name.endsWith(domain);
      const hasOrganization: IdeaPermissionCheck = resource => resource.organizationId === organizationId;
      const isAmongShared: IdeaPermissionCheck = resource =>
        resource.ownerGroupId === inventorManagerGroupId && resource.isImported && sharedIdeas.includes(resource.id);
      const hasUserOwnership: IdeaPermissionCheck = resource => resource.ownerUserId === userId;
      const hasGroupOwnership: IdeaPermissionCheck = resource => resource.ownerGroupId === inventorGroupId;

      const isPermitted: boolean =
        permissionData.length > 0 &&
        permissionData.every(
          resource =>
            hasDomain(resource) &&
            hasOrganization(resource) &&
            (hasUserOwnership(resource) || hasGroupOwnership(resource) || isAmongShared(resource))
        );
      expect(isPermitted).toBe(true);
    }
  );

  test.each([[1, 5, [1, 2, 3]], [4, 7, [5]], [6, 6, [4]]])(
    'User #%d with group \'user inventor\' should have access to all comments left for \'inventor shared\' and \'reviewer\' groups\' idea #%d',
    async (...args: Array<number | number[]>): Promise<void> => {
      const userId: number = args[0] as number;
      const ideaId: number = args[1] as number;
      const sharedComments: number[] = args[2] as number[];
      const supportedActions: Action[] = [Action.READ, Action.DELETE_OWN, Action.EDIT_OWN];

      const commentPermissionData: CommentPermissionData[] = await commentPermissionDao.getCommentsByUserIdAndIdeaId(
        userId,
        ideaId
      );

      const hasIdea: CommentPermissionCheck = resource => resource.userIdeaId === ideaId;
      const hasUserOwnership: CommentPermissionCheck = resource => resource.ownerUserId === userId;
      const hasActions: CommentPermissionCheck = resource =>
        (hasUserOwnership(resource) ? supportedActions : [supportedActions[0]]).every(permittedAction =>
          resource.permitted.includes(permittedAction)
        );

      const isPermitted: boolean =
        commentPermissionData.length > 0 &&
        _.isEqual(sharedComments, commentPermissionData.map(comment => comment.id).sort()) &&
        commentPermissionData.every(resource => hasIdea(resource) && hasActions(resource));

      expect(isPermitted).toBe(true);
    }
  );

  test.each([[1, 5], [4, 7], [6, 6], [7, 7]])(
    '\'User inventor\' extended by \'inventor shared\' or \'reviewer\' #%d should be able to retrieve imported idea by id #%d',
    async (userId: number, ideaId: number): Promise<void> => {
      const inventorManagerGroupId: number = 2;
      const result: IdeaPermissionData = await ideaPermissionDao.getIdeaByUserIdAndIdeaId(userId, ideaId);

      const isAmongShared: IdeaPermissionCheck = resource =>
        resource.ownerGroupId === inventorManagerGroupId && resource.isImported;
      const hasUserOwnership: IdeaPermissionCheck = resource => resource.ownerUserId === userId;
      const hasIdea: IdeaPermissionCheck = resource => resource.id === ideaId;

      const isPermitted: boolean = result && hasIdea(result) && (hasUserOwnership(result) || isAmongShared(result));
      expect(isPermitted).toBe(true);
    }
  );

  test.each([[9, Action.READ], [9, Action.DELETE], [9, Action.CREATE], [9, Action.EDIT]])(
    '\'Organization admin\' #%d should be able to %s user',
    async (...args: Array<number | Action>): Promise<void> => {
      const isPermitted: boolean = await userPermissionDao.checkPermissions(args[0] as number, args[1] as Action);
      expect(isPermitted).toBe(true);
    }
  );

  test.each(getAllNonOrgAdmins())(
    '\'%s\' #%d should not be able to %s user',
    async (...args: Array<number | Action | BuiltInGroupType>): Promise<void> => {
      const isPermitted: boolean = await userPermissionDao.checkPermissions(args[1] as number, args[2] as Action);
      expect(isPermitted).toBe(false);
    }
  );

  test.each([[9, 2, 1], [9, 2, 3], [9, 2, 6], [9, 2, 9], [9, 2, 10], [9, 2, 11]])(
    '\'Organization admin\' #%d (org = %d) should be able to READ user #%d (org = 2)',
    async (requesterUserId: number, organizationId: number, userId: number): Promise<void> => {
      const userPermissionData: UserPermissionData = await userPermissionDao.getOnePermittedTo(requesterUserId, userId);
      expect(userPermissionData).not.toBeUndefined();
      expect(userPermissionData.organizationId).toBe(organizationId);
      expect(userPermissionData.id).toBe(userId);
    }
  );

  test.each([[9, 2, 4], [9, 2, 7], [9, 2, 8], [9, 2, 12]])(
    '\'Organization admin\' #%d (org = %d) should not be able to READ user #%d (org = 3)',
    async (requesterUserId: number, organizationId: number, userId: number): Promise<void> => {
      const userPermissionData: UserPermissionData = await userPermissionDao.getOnePermittedTo(requesterUserId, userId);
      expect(userPermissionData).toBeUndefined();
    }
  );

  test.each([[9, Action.READ], [9, Action.DELETE], [9, Action.CREATE], [9, Action.EDIT]])(
    '\'Organization admin\' #%d should be able to %s group',
    async (...args: Array<number | Action>): Promise<void> => {
      const isPermitted: boolean = await groupPermissionDao.checkPermissions(args[0] as number, args[1] as Action);
      expect(isPermitted).toBe(true);
    }
  );

  test.each(getAllNonOrgAdmins())(
    '\'%s\' #%d should not be able to %s group',
    async (...args: Array<number | Action | BuiltInGroupType>): Promise<void> => {
      const isPermitted: boolean = await groupPermissionDao.checkPermissions(args[1] as number, args[2] as Action);
      expect(isPermitted).toBe(false);
    }
  );

  // Org admin should read built-in groups by default and inventor manager - only manually assigned groups
  test.each([[9, 1], [9, 2], [9, 3], [9, 4], [9, 5], [9, 6], [3, 4], [3, 6]])(
    'User #%d should be able to READ built-in group #%d',
    async (userId: number, groupId: number): Promise<void> => {
      const groupPermissionData: GroupPermissionData[] = await groupPermissionDao.getGroupByUserIdAndGroupId(
        userId,
        groupId
      );
      expect(groupPermissionData).toHaveLength(1);

      const actualGroup: GroupPermissionData = groupPermissionData[0];
      const builtInGroup: GroupDto = builtInGroups[groupId - 1];

      expect(actualGroup.id).toBe(builtInGroup.id);
      expect(actualGroup.organizationId).toBe(1);
    }
  );

  test.each([[3, 1], [3, 2], [3, 3], [3, 5]])(
    '\'Inventor manager\' #%d should not be able to READ built-in group #%d',
    async (userId: number, groupId: number): Promise<void> => {
      const groupPermissionData: GroupPermissionData[] = await groupPermissionDao.getGroupByUserIdAndGroupId(
        userId,
        groupId
      );
      expect(groupPermissionData).toHaveLength(0);
    }
  );

  test.each([[9, Action.READ], [9, Action.DELETE], [9, Action.CREATE], [9, Action.EDIT]])(
    '\'Organization admin\' #%d should be able to %s permission',
    async (...args: Array<number | Action>): Promise<void> => {
      const isPermitted: boolean = await permissionDao.checkPermissions(args[0] as number, args[1] as Action);
      expect(isPermitted).toBe(true);
    }
  );

  test.each(getAllNonOrgAdmins())(
    '\'%s\' #%d should not be able to %s permission',
    async (...args: Array<number | Action | BuiltInGroupType>): Promise<void> => {
      const isPermitted: boolean = await permissionDao.checkPermissions(args[1] as number, args[2] as Action);
      expect(isPermitted).toBe(false);
    }
  );

  test.each([
    [1, [5, 6, 10, 11, 13]],
    [2, [5, 6]],
    [3, [7, 8, 17, 18]],
    [7, [9, 16]],
    [9, [2, 3, 4]],
    [10, [1]],
    [11, [10, 11, 13]]
  ])(
    'User #%d should READ own permissions: %s',
    async (...args: Array<number | number[]>): Promise<void> => {
      const userId: number = args[0] as number;
      const expectedPermissions: number[] = args[1] as number[];
      const permissionsData: PermissionsData[] = await permissionDao.findAllByUserId(userId);
      expect(permissionsData.map(permission => permission.id)).toStrictEqual(expectedPermissions);
    }
  );

  test.each([[9, _.range(1, 15).concat(17, 18)]])(
    'User #%d should READ all permissions within own organization (id = 2): %s',
    async (...args: Array<number | number[]>): Promise<void> => {
      const userId: number = args[0] as number;
      const expectedPermissions: number[] = args[1] as number[];
      const permissionsData: PermissionsData[] = await permissionDao.getAllPermittedByUserId(userId);
      expect(permissionsData.map(permission => permission.id)).toStrictEqual(expectedPermissions);
    }
  );

  // All non org admins
  test.each([1, 3, 4, 6, 7, 8, 10, 11, 12])(
    'User #%d should not be able to READ permissions',
    async (userId: number): Promise<void> => {
      const permissionsData: PermissionsData[] = await permissionDao.getAllPermittedByUserId(userId);
      expect(permissionsData).toHaveLength(0);
    }
  );

  test.each([
    [8, Action.READ],
    [8, Action.RE_ASSIGN],
    [8, Action.READ_COMMENT],
    [8, Action.CREATE_COMMENT],
    [8, Action.DELETE],
    [8, Action.IMPORT],
    [8, Action.SHARE_OWN]
  ])(
    '\'Inventor manager\' #%d should be able to %s user idea',
    async (...args: Array<number | Action>): Promise<void> => {
      const isPermitted: boolean = await ideaPermissionDao.checkPermissions(args[0] as number, args[1] as Action);
      expect(isPermitted).toBe(true);
    }
  );

  function getAllNonOrgAdmins<T extends BuiltInGroupType | number | Action>(): T[][] {
    return [
      [BuiltInGroupType.USER_INVENTOR, 2, Action.READ],
      [BuiltInGroupType.USER_INVENTOR, 2, Action.CREATE],
      [BuiltInGroupType.USER_INVENTOR, 2, Action.EDIT],
      [BuiltInGroupType.USER_INVENTOR, 2, Action.DELETE],
      [BuiltInGroupType.INVENTION_MANAGER, 3, Action.READ],
      [BuiltInGroupType.INVENTION_MANAGER, 3, Action.CREATE],
      [BuiltInGroupType.INVENTION_MANAGER, 3, Action.EDIT],
      [BuiltInGroupType.INVENTION_MANAGER, 3, Action.DELETE],
      [BuiltInGroupType.REVIEWER, 6, Action.READ],
      [BuiltInGroupType.REVIEWER, 6, Action.CREATE],
      [BuiltInGroupType.REVIEWER, 6, Action.EDIT],
      [BuiltInGroupType.REVIEWER, 6, Action.DELETE],
      [BuiltInGroupType.OPUS_ADMIN, 10, Action.READ],
      [BuiltInGroupType.OPUS_ADMIN, 10, Action.CREATE],
      [BuiltInGroupType.OPUS_ADMIN, 10, Action.EDIT],
      [BuiltInGroupType.OPUS_ADMIN, 10, Action.DELETE],
      [BuiltInGroupType.INVENTOR_SHARED, 11, Action.READ],
      [BuiltInGroupType.INVENTOR_SHARED, 11, Action.CREATE],
      [BuiltInGroupType.INVENTOR_SHARED, 11, Action.EDIT],
      [BuiltInGroupType.INVENTOR_SHARED, 11, Action.DELETE]
    ] as T[][];
  }

  async function initTestData() {
    // initialise built-in data
    await initDB();
    const connection: Connection = await getConnection();
    try {
      // Test data
      await connection.query(fs.readFileSync(path.join(__dirname, testDataPath), CHARSET));
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        logger.info('Test data already exists');
      } else {
        throw new Error(`Can not insert test data: ${e.toString()}`);
      }
    }
  }
});
