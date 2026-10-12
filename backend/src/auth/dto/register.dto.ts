import { OmitType } from '@nestjs/swagger';
import { CreateUserDto } from '../../users/dto/create-user.dto.js';

/** Public sign-up: same as creating a User, but the role cannot be chosen. */
export class RegisterDto extends OmitType(CreateUserDto, ['role'] as const) {}
