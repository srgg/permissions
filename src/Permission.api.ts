import { Expose, Transform } from 'class-transformer';
import { Action, Resource } from './entity/Permission.entity';
import { IdeaState } from './entity/UserIdea.entity';
import { UserStatus } from './entity/User.entity';
import { QueryBuilderAdapter } from './QueryBuilderAdapter';
import { BuildPermissionListQueryParams } from './QueryBuilder';
import { enumKeyOf } from './util/Enum.util';
import { Prop } from './util/Decorator.util';
import { USER_GROUPS_SUB_QUERY } from './Constants';

export interface UserResultSet {
  userId: number;
}

export interface ParametrizedQuery {
  query: string;
  params: any[];
}

export class ActionData {
  public constructor(public readonly action: Action, public readonly description: string) {}
}

export class ResourceData {
  public constructor(public readonly resource: Resource, public readonly actions: ActionData[]) {}
}

export class QueryTemplate {
  constructor(public addons: object, public sql: string) {}
}

export class QueryTemplateAddon {
  constructor(public sql: string, public options: object) {}
}

export class QueryBuildParam {
  constructor(
    public shouldHaveOwnershipFilter: boolean,
    public applyQueryExtension: boolean,
    public shouldHaveOrganizationFilter: boolean
  ) {}
}

// Properties' transformers
const stringToAction: (value: string) => Action[] = (actions: string) =>
  actions.split(',').map(action => enumKeyOf(Action, action.trim()));
const stringToNumber: (value: string) => number[] = (groups: string) =>
  groups ? groups.split(',').map(group => parseInt(group.trim(), 10)) : [];
const numberToBoolean: (value: number) => boolean = (value: number) => value === 1;

export interface PermissionData {}

export class IdeaPermissionData implements PermissionData {
  @Prop()
  public id!: number;
  @Prop()
  public ownerUserId!: number;
  @Prop()
  public ownerGroupId!: number;
  @Prop()
  @Transform(stringToAction)
  public permitted!: Action[];
  @Prop()
  public organizationId!: number;
  @Prop()
  public position!: number;
  @Prop()
  public lockedAt!: Date;
  @Prop()
  public lockedBy!: number;
  @Prop()
  public name!: string;
  @Prop()
  public state!: IdeaState;
  @Prop()
  @Transform(numberToBoolean)
  public isImported!: boolean;

  public isActive(): boolean {
    return this.state === IdeaState.ACTIVE;
  }

  public isCompleted(): boolean {
    return this.state === IdeaState.COMPLETED;
  }

  public isShared(): boolean {
    return this.isImported;
  }
}

export class CommentPermissionData implements PermissionData {
  @Prop()
  public id!: number;
  @Prop()
  public ownerUserId!: number;
  @Prop()
  public ownerGroupId!: number;
  @Prop()
  @Transform(stringToAction)
  public permitted!: Action[];
  @Prop()
  public data!: string;
  @Prop()
  public userIdeaId!: number;
  @Prop('is_owner')
  @Transform(numberToBoolean)
  @Expose({ name: 'is_owner' })
  public isOwner!: boolean;
  @Prop()
  public createdAt!: Date;
}

export class GroupPermissionData implements PermissionData {
  @Prop()
  public id!: number;
  @Prop()
  public name!: string;
  @Prop()
  public description!: string;
  @Prop()
  public organizationId!: number;
}

export class UserPermissionData implements PermissionData {
  @Prop()
  public id!: number;
  @Prop()
  public email!: string;
  @Prop()
  public firstName!: string;
  @Prop()
  public lastName!: string;
  @Prop()
  public status!: UserStatus;
  @Prop()
  public expiresAt!: Date;
  @Prop()
  public organizationId!: number;
  @Prop(USER_GROUPS_SUB_QUERY)
  @Transform(stringToNumber)
  public groups!: number[];
}

export class PermissionsData implements PermissionData {
  @Prop()
  public id!: number;
  @Prop()
  public resource!: Resource;
  @Prop()
  public resourceId!: number;
  @Prop()
  @Transform(stringToAction)
  public actions!: Action[];
  @Prop()
  public userId!: number;
  @Prop()
  public groupId!: number;
}

export abstract class QueryParam {
  public columns: string[] = ['id'];
  public resourceId!: number | undefined;
  public organizationId!: number;
  public queryExtension!: string;
  public extendedParams!: object;
  public subResource!: Resource;

  public constructor(
    public userId: number,
    public resource: Resource,
    public action: Action,
    public checkOwnership: boolean
  ) {}

  public abstract prepareQuery(): ParametrizedQuery;

  public withColumns(columns: string[]): QueryParam {
    this.columns = columns.length === 0 ? this.columns : columns;
    return this;
  }

  public withInstanceId(instanceId: number | undefined): QueryParam {
    this.resourceId = instanceId;
    return this;
  }

  public withOrganizationId(organizationId: number): QueryParam {
    this.organizationId = organizationId;
    return this;
  }

  public withExtension(queryExtension: string): QueryParam {
    this.queryExtension = queryExtension;
    return this;
  }

  public withExtendedParams(extendedParams: object): QueryParam {
    this.extendedParams = extendedParams;
    return this;
  }
}

export class PrimaryResourceQuery extends QueryParam {
  public prepareQuery(): ParametrizedQuery {
    return QueryBuilderAdapter.buildPrimaryResourcesQuery(this);
  }
}

export class PermissionsListResourceQuery implements BuildPermissionListQueryParams {
  public columns?: string[];
  public organizationId?: number | null;
  public queryExtension?: string;
  public extendedParams?: object;

  constructor(public readonly userId: number) {}

  public withColumns(columns: string[]): PermissionsListResourceQuery {
    this.columns = columns;
    return this;
  }

  public withOrganizationId(organizationId: number): PermissionsListResourceQuery {
    this.organizationId = organizationId;
    return this;
  }

  public prepareQuery(): ParametrizedQuery {
    return QueryBuilderAdapter.buildPermissionListQuery(this);
  }
}

export class SecondaryResourceQuery extends QueryParam {
  constructor(
    public userId: number,
    public resource: Resource,
    public subResource: Resource,
    public action: Action,
    public checkOwnership: boolean
  ) {
    super(userId, resource, action, checkOwnership);
    this.subResource = subResource;
  }

  public prepareQuery(): ParametrizedQuery {
    return QueryBuilderAdapter.buildSecondaryResourcesQuery(this);
  }
}
