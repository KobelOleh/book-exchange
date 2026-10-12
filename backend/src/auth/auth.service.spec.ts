import { UnauthorizedException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import {
  createTestModule,
  resetDatabase,
} from '../../test/support/test-module.js';
import { Role } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import { AuthModule } from './auth.module.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let moduleRef: TestingModule;
  let auth: AuthService;

  beforeAll(async () => {
    moduleRef = await createTestModule([AuthModule]);
    auth = moduleRef.get(AuthService);
  });

  beforeEach(async () => {
    await resetDatabase(moduleRef.get(PrismaService));
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('registers a new User and issues a token that authenticates them', async () => {
    const { user, accessToken } = await auth.register({
      email: 'olena@example.com',
      name: 'Olena',
      password: 'correct-horse',
    });

    expect(user).toMatchObject({ email: 'olena@example.com', role: Role.USER });
    expect(await auth.authenticate(accessToken)).toEqual({
      id: user.id,
      role: Role.USER,
    });
  });

  it('logs in a registered User with the right credentials', async () => {
    const { user } = await auth.register({
      email: 'olena@example.com',
      name: 'Olena',
      password: 'correct-horse',
    });

    const session = await auth.login('olena@example.com', 'correct-horse');

    expect(session.user).toEqual(user);
    expect(await auth.authenticate(session.accessToken)).toMatchObject({
      id: user.id,
    });
  });

  it('rejects a token that was not issued by this service', async () => {
    await expect(auth.authenticate('not-a-real-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('reflects a role change immediately, without a new login', async () => {
    const { user, accessToken } = await auth.register({
      email: 'olena@example.com',
      name: 'Olena',
      password: 'correct-horse',
    });

    await moduleRef
      .get(UsersService)
      .update({ id: 'other-admin', role: Role.ADMIN }, user.id, {
        role: Role.ADMIN,
      });

    expect(await auth.authenticate(accessToken)).toEqual({
      id: user.id,
      role: Role.ADMIN,
    });
  });

  it('stops accepting the token of a removed User', async () => {
    const users = moduleRef.get(UsersService);
    const admin = await users.create({
      email: 'admin@example.com',
      name: 'Admin',
      password: 'admin-pass-123',
      role: Role.ADMIN,
    });
    const { user, accessToken } = await auth.register({
      email: 'olena@example.com',
      name: 'Olena',
      password: 'correct-horse',
    });

    await users.remove(admin, user.id);

    await expect(auth.authenticate(accessToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('refuses to log in with a wrong password or an unknown email', async () => {
    await auth.register({
      email: 'olena@example.com',
      name: 'Olena',
      password: 'correct-horse',
    });

    await expect(
      auth.login('olena@example.com', 'wrong-password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      auth.login('nobody@example.com', 'correct-horse'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
