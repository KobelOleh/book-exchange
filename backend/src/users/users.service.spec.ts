import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import {
  createTestModule,
  resetDatabase,
} from '../../test/support/test-module.js';
import { AuthenticatedUser } from '../common/authenticated-user.js';
import { Role } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersModule } from './users.module.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  let moduleRef: TestingModule;
  let users: UsersService;
  const actor: AuthenticatedUser = {
    id: '11111111-1111-4111-8111-111111111111',
    role: Role.ADMIN,
  };

  beforeAll(async () => {
    moduleRef = await createTestModule([UsersModule]);
    users = moduleRef.get(UsersService);
  });

  beforeEach(async () => {
    await resetDatabase(moduleRef.get(PrismaService));
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('creates a User with the User role and never exposes the password hash', async () => {
    const user = await users.create({
      email: 'olena@example.com',
      name: 'Olena',
      password: 'correct-horse',
    });

    expect(user).toMatchObject({
      email: 'olena@example.com',
      name: 'Olena',
      role: Role.USER,
    });
    expect(user).not.toHaveProperty('passwordHash');
  });

  it('rejects a second User with an email that is already registered', async () => {
    const input = {
      email: 'olena@example.com',
      name: 'Olena',
      password: 'correct-horse',
    };
    await users.create(input);

    await expect(users.create(input)).rejects.toBeInstanceOf(ConflictException);
  });

  it('verifies credentials of a registered User without exposing the hash', async () => {
    const created = await users.create({
      email: 'olena@example.com',
      name: 'Olena',
      password: 'correct-horse',
    });

    const verified = await users.verifyCredentials(
      'olena@example.com',
      'correct-horse',
    );

    expect(verified).toEqual(created);
  });

  it('rejects a wrong password and an unknown email the same way', async () => {
    await users.create({
      email: 'olena@example.com',
      name: 'Olena',
      password: 'correct-horse',
    });

    expect(
      await users.verifyCredentials('olena@example.com', 'wrong-password'),
    ).toBeNull();
    expect(
      await users.verifyCredentials('nobody@example.com', 'correct-horse'),
    ).toBeNull();
  });

  it('finds a User by id', async () => {
    const created = await users.create({
      email: 'olena@example.com',
      name: 'Olena',
      password: 'correct-horse',
    });

    expect(await users.findById(created.id)).toEqual(created);
  });

  it('lists all Users in registration order without password hashes', async () => {
    const first = await users.create({
      email: 'olena@example.com',
      name: 'Olena',
      password: 'correct-horse',
    });
    const second = await users.create({
      email: 'andrii@example.com',
      name: 'Andrii',
      password: 'battery-staple',
    });

    expect(await users.list()).toEqual([first, second]);
  });

  it('updates the name and role of a User', async () => {
    const created = await users.create({
      email: 'olena@example.com',
      name: 'Olena',
      password: 'correct-horse',
    });

    const updated = await users.update(actor, created.id, {
      name: 'Olena K.',
      role: Role.ADMIN,
    });

    expect(updated).toEqual({ ...created, name: 'Olena K.', role: Role.ADMIN });
  });

  it('replaces the credentials when the password is changed', async () => {
    const created = await users.create({
      email: 'olena@example.com',
      name: 'Olena',
      password: 'correct-horse',
    });

    await users.update(actor, created.id, { password: 'battery-staple' });

    expect(
      await users.verifyCredentials('olena@example.com', 'battery-staple'),
    ).toEqual(created);
    expect(
      await users.verifyCredentials('olena@example.com', 'correct-horse'),
    ).toBeNull();
  });

  it('rejects changing the email to one that is already registered', async () => {
    await users.create({
      email: 'andrii@example.com',
      name: 'Andrii',
      password: 'battery-staple',
    });
    const olena = await users.create({
      email: 'olena@example.com',
      name: 'Olena',
      password: 'correct-horse',
    });

    await expect(
      users.update(actor, olena.id, { email: 'andrii@example.com' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('reports updating a missing User as not found', async () => {
    await expect(
      users.update(actor, '00000000-0000-0000-0000-000000000000', {
        name: 'Ghost',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('stores emails lowercased and logs in regardless of case', async () => {
    const created = await users.create({
      email: ' Olena@Example.COM ',
      name: 'Olena',
      password: 'correct-horse',
    });

    expect(created.email).toBe('olena@example.com');
    expect(
      await users.verifyCredentials('OLENA@example.com', 'correct-horse'),
    ).toEqual(created);
    await expect(
      users.create({
        email: 'olena@example.com',
        name: 'Other',
        password: 'correct-horse',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('sets and clears the avatar of a User', async () => {
    const created = await users.create({
      email: 'olena@example.com',
      name: 'Olena',
      password: 'correct-horse',
    });
    const avatarUrl = 'https://example.com/olena.png';

    const withAvatar = await users.update(actor, created.id, { avatarUrl });
    const cleared = await users.update(actor, created.id, { avatarUrl: null });

    expect(withAvatar.avatarUrl).toBe(avatarUrl);
    expect(cleared.avatarUrl).toBeNull();
  });

  it('counts the Books a User owns on their Profile', async () => {
    const prisma = moduleRef.get(PrismaService);
    const created = await users.create({
      email: 'olena@example.com',
      name: 'Olena',
      password: 'correct-horse',
    });
    await prisma.book.createMany({
      data: ['Kobzar', 'Dune'].map((name) => ({
        name,
        author: 'Anon',
        photoUrl: 'https://example.com/cover.png',
        ownerId: created.id,
      })),
    });

    expect(await users.findProfile(created.id)).toEqual({
      ...created,
      booksCount: 2,
    });
  });

  it('forbids an Admin from changing their own role', async () => {
    const admin = await users.create({
      email: 'admin@example.com',
      name: 'Admin',
      password: 'admin-pass-123',
      role: Role.ADMIN,
    });

    await expect(
      users.update({ id: admin.id, role: Role.ADMIN }, admin.id, {
        role: Role.USER,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect((await users.findById(admin.id)).role).toBe(Role.ADMIN);
  });

  it('lets an Admin remove another User', async () => {
    const admin = await users.create({
      email: 'admin@example.com',
      name: 'Admin',
      password: 'admin-pass-123',
      role: Role.ADMIN,
    });
    const olena = await users.create({
      email: 'olena@example.com',
      name: 'Olena',
      password: 'correct-horse',
    });

    await users.remove(admin, olena.id);

    await expect(users.findById(olena.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('forbids an Admin to remove themselves', async () => {
    const admin = await users.create({
      email: 'admin@example.com',
      name: 'Admin',
      password: 'admin-pass-123',
      role: Role.ADMIN,
    });

    await expect(users.remove(admin, admin.id)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('reports removing a missing User as not found', async () => {
    const admin = await users.create({
      email: 'admin@example.com',
      name: 'Admin',
      password: 'admin-pass-123',
      role: Role.ADMIN,
    });

    await expect(
      users.remove(admin, '00000000-0000-0000-0000-000000000000'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('reports a missing User as not found', async () => {
    await expect(
      users.findById('00000000-0000-0000-0000-000000000000'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
