import type { Request } from 'express';
import { AuthenticatedUser } from './authenticated-user.js';

export type AuthenticatedRequest = Request & { user?: AuthenticatedUser };
