import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './User.entity';
import { Group } from './Group.entity';
import { Organization } from './Organization.entity';

export enum Action {
  CREATE = 'CREATE',
  EDIT = 'EDIT',
  READ = 'READ',
  DELETE = 'DELETE',
  EDIT_OWN = 'EDIT_OWN',
  READ_OWN = 'READ_OWN',
  DELETE_OWN = 'DELETE_OWN',
  CREATE_COMMENT_OWN = 'CREATE_COMMENT_OWN',
  READ_COMMENT_OWN = 'READ_COMMENT_OWN',
  READ_COMMENT = 'READ_COMMENT',
  CREATE_COMMENT = 'CREATE_COMMENT',
  RE_ASSIGN = 'RE_ASSIGN',
  IMPORT = 'IMPORT',
  SHARE_OWN = 'SHARE_OWN'
}

export enum Resource {
  USER = 'user',
  IDEA = 'user_idea',
  COMMENT = 'comment',
  GROUP = 'group',
  ORGANIZATION = 'organization',
  PERMISSION = 'permission'
}

@Entity()
export class Permission {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column('enum', { enum: Resource })
  public resource!: Resource;

  @Column({ nullable: true })
  public resourceId!: number;

  @Column('simple-array')
  public actions!: Action[];

  @ManyToOne(type => User)
  public user!: User;

  @ManyToOne(type => Group)
  public group!: Group;

  @ManyToOne(type => Organization)
  public organization!: Organization;

  public withResource(resource: Resource): Permission {
    this.resource = resource;
    return this;
  }

  public withResourceId(resourceId: number): Permission {
    this.resourceId = resourceId;
    return this;
  }

  public withActions(actions: Action[]): Permission {
    this.actions = actions;
    return this;
  }

  public withGroup(group: Group): Permission {
    this.group = group;
    return this;
  }

  public withUser(user: User): Permission {
    this.user = user;
    return this;
  }

  public withOrganization(organization: Organization): Permission {
    this.organization = organization;
    return this;
  }
}
