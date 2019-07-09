import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../entity/user';

@Entity()
export class Idea {

    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ nullable: false})
    public name!: string;

    @Column({ default: 0 })
    public position!: number;

    @ManyToOne(type => User, user => user.ideas)
    public user!: User;
}
