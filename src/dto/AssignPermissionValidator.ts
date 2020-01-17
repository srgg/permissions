import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { PermissionDto } from './Permission.dto';
import { CREATE_PERMISSION_CONFLICT } from '../Constants';

@ValidatorConstraint()
export class AssignPermissionValidator implements ValidatorConstraintInterface {
  public async validate(text: string, args: ValidationArguments): Promise<boolean> {
    const permissionDto: PermissionDto = args.object as PermissionDto;
    return !(
      (permissionDto.groupId && permissionDto.userId) ||
      (!permissionDto.groupId && !permissionDto.userId) ||
      (permissionDto.userId && permissionDto.userId <= 0) ||
      (permissionDto.groupId && permissionDto.groupId <= 0)
    );
  }

  public defaultMessage(args: ValidationArguments): string {
    return CREATE_PERMISSION_CONFLICT;
  }
}
