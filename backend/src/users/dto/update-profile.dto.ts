import { PartialType, PickType } from '@nestjs/swagger';
import { IsOptional, IsUrl, MaxLength } from 'class-validator';
import { CreateUserDto } from './create-user.dto.js';

/** What a User may change about themselves; the role and password are not included. */
export class UpdateProfileDto extends PartialType(
  PickType(CreateUserDto, ['name', 'email'] as const),
) {
  /** `null` removes the avatar. */
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  avatarUrl?: string | null;
}
