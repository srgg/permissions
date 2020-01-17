import * as _ from 'lodash';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn
} from 'typeorm';
import { Group } from './Group.entity';
import { Comment } from './Comment.entity';
import { Organization } from './Organization.entity';

export enum UserStatus {
  INACTIVE = 'INACTIVE',
  ACTIVE = 'ACTIVE'
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column()
  public email!: string;

  @Column({ default: '' })
  public firstName!: string;

  @Column({ default: '' })
  public lastName!: string;

  @Column()
  public password!: string;

  @Column({ default: '' })
  public secretPhrase!: string;

  @Column('enum', { enum: UserStatus, default: UserStatus.INACTIVE })
  public status!: UserStatus;

  @Column({ default: '' })
  public activationHash!: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public expiresAt!: Date;

  @Column({ length: 1000, default: '' })
  public refreshToken!: string;

  @OneToMany(type => Comment, comment => comment.ownerUser, {
    cascade: true,
    eager: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn()
  public comments!: Comment[];

  @ManyToMany(type => Group, group => group.users)
  @JoinTable({ name: 'users_groups' })
  public groups!: Group[];

  @ManyToOne(type => Organization)
  public organization!: Organization;

  constructor(email?: string) {
    this.email = email || '';
  }

  public get fullName(): string {
    return this.firstName && this.lastName ? `${this.firstName} ${this.lastName}` : '';
  }

  public isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  public get domain(): string {
    return this.email.substring(this.email.indexOf('@') + 1);
  }

  public withId(id: number): User {
    this.id = id;
    return this;
  }

  public withStatus(status: UserStatus): User {
    this.status = status;
    return this;
  }

  public withGroup(groups: Group[]): User {
    if (groups.length === 0) {
      return this;
    }

    if (!this.hasGroups()) {
      this.groups = [];
    }

    groups.filter(group => !this.hasGroup(group)).forEach(role => this.groups.push(role));

    return this;
  }

  public withFirstName(firstName: string): User {
    this.firstName = firstName;
    return this;
  }

  public withLastName(lastName: string): User {
    this.lastName = lastName;
    return this;
  }

  public withOrganization(organization: Organization): User {
    this.organization = organization;
    return this;
  }

  public withPassword(password: string): User {
    this.password = password;
    return this;
  }

  public withActivationHash(hash: string): User {
    this.activationHash = hash;
    return this;
  }

  public withExpiration(date: Date): User {
    this.expiresAt = date;
    return this;
  }

  public hasGroups(): boolean {
    return !_.isEmpty(this.groups);
  }

  public hasGroup(group: Group): boolean {
    return this.hasGroups() && this.groups.some(userRole => userRole.name === group.name);
  }

  public hasSingleGroup(groupName: string): boolean {
    return this.hasGroups() && this.groups.length === 1 && this.groups.some(group => group.name === groupName);
  }
}
