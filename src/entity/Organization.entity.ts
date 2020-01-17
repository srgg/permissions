import { IsFQDN } from 'class-validator';
import { Column, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Group } from './Group.entity';
import { User } from './User.entity';

@Entity()
export class Organization {
  private static readonly nameLength: number = 1000;

  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({ nullable: false, length: Organization.nameLength })
  public name!: string;

  @Column()
  @IsFQDN()
  public domain!: string;

  @Column({ type: 'text' })
  public description!: string;

  @OneToMany(type => Group, groups => groups.organization, {
    cascade: true,
    eager: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn()
  public groups!: Group[];

  @OneToMany(type => User, user => user.organization, {
    cascade: true,
    eager: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn()
  public users!: User[];
}
