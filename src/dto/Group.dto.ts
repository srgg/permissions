import { IsNotEmpty } from 'class-validator';

export class GroupDto {
  public id!: number;

  @IsNotEmpty()
  public name!: string;

  public description!: string;

  public withId(id: number): GroupDto {
    this.id = id;
    return this;
  }

  public withName(name: string): GroupDto {
    this.name = name;
    return this;
  }

  public withDescription(description: string): GroupDto {
    this.description = description;
    return this;
  }
}
