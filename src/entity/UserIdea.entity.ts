import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './User.entity';
import { Group } from './Group.entity';
import { Comment } from './Comment.entity';
import { Organization } from './Organization.entity';

export enum IdeaState {
  COMPLETED = 'COMPLETED',
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  IMPORTED = 'IMPORTED'
}

@Entity()
export class UserIdea {
  private static readonly nameLength: number = 1000;

  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({ nullable: false, length: UserIdea.nameLength })
  public name!: string;

  @Column({ default: 0 })
  public position!: number;

  @Column('enum', { enum: IdeaState })
  public state!: IdeaState;

  @Column({ default: 0 })
  public lockedBy!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public lockedAt!: Date;

  @Column({ default: false })
  public isImported!: boolean;

  @OneToMany(type => Comment, comment => comment.userIdea, {
    cascade: true,
    eager: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn()
  public comments!: Comment[];

  @ManyToOne(type => User)
  public ownerUser!: User;

  @ManyToOne(type => Group)
  public ownerGroup!: Group;

  @ManyToOne(type => Organization)
  public organization!: Organization;

  public isActive(): boolean {
    return this.state === IdeaState.ACTIVE;
  }

  public isCompleted(): boolean {
    return this.state === IdeaState.COMPLETED;
  }

  public isShared(): boolean {
    return this.isImported;
  }

  public isDraft(): boolean {
    return this.state === IdeaState.DRAFT;
  }
}
