import { Column, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Idea } from '../entity/idea';

export enum UserStatus {
    INACTIVE = 'INACTIVE',
    ACTIVE = 'ACTIVE'
}

export enum UserRole {
    ADMIN = 'ADMIN',
    USER = 'USER'
}

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public email!: string;

    @Column()
    public password!: string;


    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    public expiresAt!: Date;

    @OneToMany(type => Idea, idea => idea.user, {
        cascade: true,
        eager: true,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    })
    public ideas!: Idea[];
}
