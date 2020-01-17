import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './User.entity';
import { UserIdea } from './UserIdea.entity';

@Entity()
export class Comment {
  private static readonly commentLength: number = 3000;

  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({ length: Comment.commentLength })
  public data!: string;

  @Column({ default: null })
  public ownerGroupId!: number;

  @CreateDateColumn({ type: 'timestamp' })
  public createdAt!: Date;

  @ManyToOne(type => User, user => user.comments, {
    onDelete: 'CASCADE'
  })
  public ownerUser!: User;

  @ManyToOne(type => UserIdea, userIdea => userIdea.comments, {
    onDelete: 'CASCADE'
  })
  public userIdea!: UserIdea;

  constructor(ownerUser: User, idea: UserIdea, data: string) {
    this.ownerUser = ownerUser;
    this.userIdea = idea;
    this.data = data;
  }
}
