import { Role } from '../generated/prisma/client.js';

/** The caller of a request, as established by authentication. */
export interface AuthenticatedUser {
  id: string;
  role: Role;
}
