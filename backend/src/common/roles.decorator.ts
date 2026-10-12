import { SetMetadata } from '@nestjs/common';
import { Role } from '../generated/prisma/client.js';

export const ROLES_KEY = 'roles';

/** Restricts a route to callers holding one of the given roles. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
