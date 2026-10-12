import { PickType } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { CreateUserDto } from '../../users/dto/create-user.dto.js';

export class ResetPasswordDto extends PickType(CreateUserDto, [
  'password',
] as const) {
  /** The secret part of the Password Reset Link. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  token: string;
}
