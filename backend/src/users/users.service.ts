import {
  ConflictException,
  ForbiddenException,
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
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  role?: Role;
}

export type UpdateUserInput = Partial<CreateUserInput>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create({ password, ...data }: CreateUserInput): Promise<PublicUser> {
    try {
      return await this.prisma.user.create({
        data: {
          ...data,
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
    id: string,
    { password, ...data }: UpdateUserInput,
  ): Promise<PublicUser> {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          ...data,
          ...(password && { passwordHash: await hashPassword(password) }),
        },
        select: publicUserSelect,
      });
    } catch (error) {
      throw translatePrismaError(error);
    }
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

  async verifyCredentials(
    email: string,
    password: string,
  ): Promise<PublicUser | null> {
    const found = await this.prisma.user.findUnique({
      where: { email },
      select: { ...publicUserSelect, passwordHash: true },
    });

    if (!found || !(await bcrypt.compare(password, found.passwordHash))) {
      return null;
    }

    const { passwordHash: _passwordHash, ...user } = found;
    return user;
  }
}

function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_HASH_ROUNDS);
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
