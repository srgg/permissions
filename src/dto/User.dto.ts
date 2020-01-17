import { IsArray, IsDate, IsEmail, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { UserStatus } from '../entity/User.entity';

export class UserDto {
  @IsNumber()
  public id!: number;

  @IsEmail()
  public email!: string;

  @IsOptional()
  public firstName!: string;

  @IsOptional()
  public lastName!: string;

  @IsDate()
  public expiresAt!: Date;

  @IsArray()
  public groups!: string[] | number[];

  @IsNotEmpty()
  public status!: UserStatus;

  @IsOptional()
  public token!: string;

  constructor(id: number, groups: string[] | number[], expiresAt: Date) {
    this.id = id;
    this.expiresAt = expiresAt;
    this.groups = groups;
  }

  public withEmail(email: string): UserDto {
    this.email = email;
    return this;
  }

  public withFirstName(firstName: string): UserDto {
    this.firstName = firstName;
    return this;
  }

  public withLastName(lastName: string): UserDto {
    this.lastName = lastName;
    return this;
  }

  public withStatus(status: UserStatus): UserDto {
    this.status = status;
    return this;
  }

  public withToken(token: string): UserDto {
    this.token = token;
    return this;
  }
}
