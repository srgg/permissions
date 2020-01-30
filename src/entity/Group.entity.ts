import { Column, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Organization } from './Organization.entity';
import { User } from './User.entity';

export enum BuiltInGroupType {
  REVIEWER = 'reviewer',
  USER_INVENTOR = 'inventor private',
  OPUS_ADMIN = 'opus admin',
  ORGANIZATION_ADMIN = 'organization admin',
  INVENTION_MANAGER = 'invention manager',
  INVENTOR_SHARED = 'inventor shared'
}

@Entity()
export class Group {
  private static readonly descriptionLength: number = 1000;
  private static readonly nameLength: number = 100;

  @Column({ nullable: false, length: Group.nameLength })
  public name!: string;

  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({ length: Group.descriptionLength, default: '' })
  public description!: string;

  @ManyToMany(type => User, user => user.groups)
  public users!: User[];

  @ManyToOne(type => Organization, organization => organization.groups, {
    onDelete: 'CASCADE'
  })
  public organization!: Organization;

  constructor(name: string, user: User) {
    this.name = name;
    if (user) {
      this.organization = user.organization;
    }
  }

  public withDescription(description: string): Group {
    this.description = description;
    return this;
  }

  public withName(name: string): Group {
    this.name = name;
    return this;
  }
}
