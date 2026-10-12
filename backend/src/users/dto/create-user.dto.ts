import {
  IsEmail,
  IsByteLength,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '../../generated/prisma/client.js';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  // bcrypt only uses the first 72 bytes (not characters) of a password.
  @IsString()
  @MinLength(8)
  @IsByteLength(0, 72)
  password: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
