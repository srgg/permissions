import { ArrayMinSize, IsArray, IsNotEmpty, IsOptional, Validate } from 'class-validator';
import { Action, Resource } from '../entity/Permission.entity';
import { AssignPermissionValidator } from './AssignPermissionValidator';

export class PermissionDto {
  @IsOptional()
  public id!: number;
  @IsNotEmpty()
  public resource!: Resource;
  @IsArray()
  @ArrayMinSize(1)
  public actions!: Action[];
  @IsOptional()
  public resourceId!: number;
  @Validate(AssignPermissionValidator)
  public userId!: number;
  @Validate(AssignPermissionValidator)
  public groupId!: number;

  public withResource(resource: Resource): PermissionDto {
    this.resource = resource;
    return this;
  }

  public withActions(actions: Action[]): PermissionDto {
    this.actions = actions;
    return this;
  }

  public withResourceId(id: number): PermissionDto {
    this.resourceId = id;
    return this;
  }

  public withUserId(id: number): PermissionDto {
    this.userId = id;
    return this;
  }

  public withGroupId(id: number): PermissionDto {
    this.groupId = id;
    return this;
  }

  public withId(id: number): PermissionDto {
    this.id = id;
    return this;
  }
}
