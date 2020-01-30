// Test data which reflects real built-in content
import * as _ from 'lodash';
import { BuiltInGroupType } from '../src/entity/Group.entity';
import { PermissionDto } from '../src/dto/Permission.dto';
import { Action, Resource } from '../src/entity/Permission.entity';
import { GroupDto } from '../src/dto/Group.dto';
import { UserDto } from '../src/dto/User.dto';

export const builtInPermissions: PermissionDto[] = [
  new PermissionDto()
    .withId(1)
    .withResource(Resource.ORGANIZATION)
    .withActions([Action.READ, Action.CREATE, Action.EDIT, Action.DELETE])
    .withGroupId(3),
  new PermissionDto()
    .withId(2)
    .withResource(Resource.USER)
    .withActions([Action.READ, Action.CREATE, Action.EDIT, Action.DELETE])
    .withGroupId(5),
  new PermissionDto()
    .withId(3)
    .withResource(Resource.PERMISSION)
    .withActions([Action.READ, Action.CREATE, Action.EDIT, Action.DELETE])
    .withGroupId(5),
  new PermissionDto()
    .withId(4)
    .withResource(Resource.GROUP)
    .withActions([Action.READ, Action.CREATE, Action.EDIT, Action.DELETE])
    .withGroupId(5),
  new PermissionDto()
    .withId(5)
    .withResource(Resource.IDEA)
    .withActions([Action.CREATE, Action.READ_OWN, Action.EDIT_OWN, Action.CREATE_COMMENT_OWN, Action.READ_COMMENT_OWN])
    .withGroupId(1),
  new PermissionDto()
    .withId(6)
    .withResource(Resource.COMMENT)
    .withActions([Action.EDIT_OWN, Action.DELETE_OWN])
    .withGroupId(1),
  new PermissionDto()
    .withId(7)
    .withResource(Resource.COMMENT)
    .withActions([Action.EDIT_OWN, Action.DELETE_OWN])
    .withGroupId(2),
  new PermissionDto()
    .withId(8)
    .withResource(Resource.COMMENT)
    .withActions([Action.EDIT_OWN, Action.DELETE_OWN])
    .withGroupId(4),
  new PermissionDto()
    .withId(9)
    .withResource(Resource.COMMENT)
    .withActions([Action.EDIT_OWN, Action.DELETE_OWN])
    .withGroupId(6),
  new PermissionDto()
    .withId(10)
    .withResource(Resource.IDEA)
    .withActions([
      Action.READ,
      Action.RE_ASSIGN,
      Action.READ_COMMENT,
      Action.CREATE_COMMENT,
      Action.DELETE,
      Action.IMPORT,
      Action.SHARE_OWN
    ])
    .withGroupId(2)
];
export const builtInGroups: GroupDto[] = [
  new GroupDto().withId(1).withName(BuiltInGroupType.USER_INVENTOR),
  new GroupDto().withId(2).withName(BuiltInGroupType.INVENTION_MANAGER),
  new GroupDto().withId(3).withName(BuiltInGroupType.OPUS_ADMIN),
  new GroupDto().withId(4).withName(BuiltInGroupType.REVIEWER),
  new GroupDto().withId(5).withName(BuiltInGroupType.ORGANIZATION_ADMIN),
  new GroupDto().withId(6).withName(BuiltInGroupType.INVENTOR_SHARED)
];
export const users: UserDto[] = [
  new UserDto(1, [BuiltInGroupType.USER_INVENTOR, BuiltInGroupType.INVENTOR_SHARED], new Date()),
  new UserDto(2, [BuiltInGroupType.INVENTION_MANAGER], new Date()),
  new UserDto(3, [BuiltInGroupType.ORGANIZATION_ADMIN], new Date()),
  new UserDto(4, [BuiltInGroupType.USER_INVENTOR], new Date()),
  new UserDto(5, [BuiltInGroupType.REVIEWER], new Date()),
  new UserDto(6, [BuiltInGroupType.OPUS_ADMIN], new Date())
];

// Check permissions simulation based on test data
export function simulateCheckPermissions(userId: number, resource: Resource, action: Action, resourceId?: number) {
  const requester: UserDto | undefined = users.find(user => user.id === userId);
  if (!requester) {
    return false;
  }

  const groups: GroupDto[] = builtInGroups.filter(group => (requester.groups as string[]).includes(group.name));

  const isAssignedToGroupOrUser: (permission: PermissionDto) => boolean = permission =>
    permission.groupId
      ? groups.some(group => group.id === permission.groupId)
      : permission.userId
      ? permission.userId === requester.id
      : false;
  const hasResourceToCheck: (permission: PermissionDto) => boolean = permission =>
    resourceId && permission.resourceId ? resourceId === permission.resourceId : true;

  return builtInPermissions
    .filter(permission => permission.resource === resource)
    .some(
      permission =>
        permission.actions.includes(action) && hasResourceToCheck(permission) && isAssignedToGroupOrUser(permission)
    );
}

export function adjustRandomPermission(recordId: number): PermissionDto {
  const permissionDto: PermissionDto = _.cloneDeep(builtInPermissions[recordId]);

  if (permissionDto.groupId) {
    const filteredGroups: GroupDto[] = builtInGroups.filter(group => group.id !== permissionDto.groupId);
    permissionDto.groupId = filteredGroups[getRandomIndex(filteredGroups.length)].id;
  } else if (permissionDto.userId) {
    const filteredUsers: UserDto[] = users.filter(user => user.id !== permissionDto.userId);
    permissionDto.userId = filteredUsers[getRandomIndex(filteredUsers.length)].id;
  }

  return permissionDto;
}

export function getRandomPermissionData<T extends number | PermissionDto>(): T[][] {
  let recordId: number = getRandomIndex(builtInPermissions.length);
  const permissionDto: PermissionDto = adjustRandomPermission(recordId);
  return [[++recordId, permissionDto]] as T[][];
}

export const getRandomIndex: (length: number) => number = length => Math.floor(Math.random() * length);

export function getRandomItems<T>(collection: T[], size: number): T[] {
  return _.shuffle(collection).slice(0, size);
}

export function getUsersWithin<T extends string | UserDto>(...groups: BuiltInGroupType[]): T[][] {
  return users
    .filter(user =>
      (user.groups as string[]).every(group => groups.map(builtInGroup => builtInGroup.toString()).includes(group))
    )
    .map(user => [user.groups.join(','), user]) as T[][];
}
