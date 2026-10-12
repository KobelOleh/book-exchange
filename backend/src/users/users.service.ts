import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { AuthenticatedUser } from '../common/authenticated-user.js';
import { Prisma, Role } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

const PASSWORD_HASH_ROUNDS = 10;

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;

const profileSelect = {
  ...publicUserSelect,
  _count: { select: { books: true } },
} satisfies Prisma.UserSelect;

/** A User as seen on their own Profile: includes how many Books they own. */
export type Profile = PublicUser & { booksCount: number };

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  role?: Role;
}

export type UpdateUserInput = Partial<CreateUserInput> & {
  avatarUrl?: string | null;
};

export type UpdateProfileInput = Pick<
  UpdateUserInput,
  'name' | 'email' | 'avatarUrl'
> & {
  currentPassword?: string;
};

@Injectable()
export class UsersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create({ password, ...data }: CreateUserInput): Promise<PublicUser> {
    try {
      return await this.prisma.user.create({
        data: {
          ...data,
          email: normalizeEmail(data.email),
          passwordHash: await hashPassword(password),
        },
        select: publicUserSelect,
      });
    } catch (error) {
      throw translatePrismaError(error);
    }
  }

  async list(): Promise<PublicUser[]> {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: publicUserSelect,
    });
  }

  async update(
    actor: AuthenticatedUser,
    id: string,
    { password, ...data }: UpdateUserInput,
  ): Promise<PublicUser> {
    if (
      actor.id === id &&
      data.role !== undefined &&
      data.role !== actor.role
    ) {
      throw new ForbiddenException('You cannot change your own role');
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          ...data,
          ...(data.email && { email: normalizeEmail(data.email) }),
          // A new password ends the User's other sessions.
          ...(password && {
            passwordHash: await hashPassword(password),
            sessionVersion: { increment: 1 },
          }),
        },
        select: publicUserSelect,
      });
    } catch (error) {
      throw translatePrismaError(error);
    }
  }

  /**
   * Edits the caller's own Profile. Changing the email also needs the current
   * password, so a stolen session cannot redirect password resets to the thief.
   */
  async updateProfile(
    actor: AuthenticatedUser,
    { currentPassword, ...changes }: UpdateProfileInput,
  ): Promise<PublicUser> {
    if (changes.email !== undefined) {
      const { email } = await this.findById(actor.id);
      if (normalizeEmail(changes.email) !== email) {
        if (!currentPassword) {
          throw new ForbiddenException(
            'Enter your current password to change your email',
          );
        }
        if (!(await this.verifyCredentials(email, currentPassword))) {
          throw new ForbiddenException('Current password is incorrect');
        }
      }
    }
    return this.update(actor, actor.id, changes);
  }

  async remove(actor: AuthenticatedUser, id: string): Promise<void> {
    if (actor.id === id) {
      throw new ForbiddenException('You cannot remove yourself');
    }

    try {
      await this.prisma.user.delete({ where: { id } });
    } catch (error) {
      throw translatePrismaError(error);
    }
  }

  async findById(id: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: publicUserSelect,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findProfile(id: string): Promise<Profile> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: profileSelect,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { _count, ...publicUser } = user;
    return { ...publicUser, booksCount: _count.books };
  }

  /** What a session needs to be valid: who the User is and which sessions are current. */
  async findSession(
    id: string,
  ): Promise<AuthenticatedUser & { sessionVersion: number }> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, sessionVersion: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async verifyCredentials(
    email: string,
    password: string,
  ): Promise<PublicUser | null> {
    const found = await this.prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
      select: { ...publicUserSelect, passwordHash: true },
    });

    // Always run a bcrypt comparison so an unknown email costs as much time as
    // a wrong password and cannot be told apart by response time.
    const matches = await bcrypt.compare(
      password,
      found?.passwordHash ?? (await getDummyPasswordHash()),
    );
    if (!found || !matches) {
      return null;
    }

    const { passwordHash: _passwordHash, ...user } = found;
    return user;
  }
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_HASH_ROUNDS);
}

let dummyPasswordHash: Promise<string> | undefined;

function getDummyPasswordHash(): Promise<string> {
  dummyPasswordHash ??= hashPassword('dummy-password-for-timing');
  return dummyPasswordHash;
}

/** Emails are case-insensitive for people, so store and look them up lowercased. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';
const RECORD_NOT_FOUND = 'P2025';

function translatePrismaError(error: unknown): unknown {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === UNIQUE_CONSTRAINT_VIOLATION) {
      return new ConflictException('Email is already registered');
    }
    if (error.code === RECORD_NOT_FOUND) {
      return new NotFoundException('User not found');
    }
  }
  return error;
}
