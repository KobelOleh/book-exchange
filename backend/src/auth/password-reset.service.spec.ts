import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import {
  createTestModule,
  resetDatabase,
} from '../../test/support/test-module.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthModule } from './auth.module.js';
import { AuthService } from './auth.service.js';
import { PasswordResetNotifier } from './password-reset-notifier.js';
import { PasswordResetService } from './password-reset.service.js';

describe('PasswordResetService', () => {
  let moduleRef: TestingModule;
  let auth: AuthService;
  let passwordReset: PasswordResetService;
  let prisma: PrismaService;
  let sentLinks: string[];

  const olena = {
    email: 'olena@example.com',
    name: 'Olena',
    password: 'correct-horse',
  };

  const tokenFrom = (link: string) => new URL(link).searchParams.get('token')!;

  beforeAll(async () => {
    moduleRef = await createTestModule([AuthModule]);
    auth = moduleRef.get(AuthService);
    passwordReset = moduleRef.get(PasswordResetService);
    prisma = moduleRef.get(PrismaService);
    sentLinks = [];
    vi.spyOn(moduleRef.get(PasswordResetNotifier), 'notify').mockImplementation(
      ({ resetLink }) => {
        sentLinks.push(resetLink);
      },
    );
  });

  beforeEach(async () => {
    sentLinks.length = 0;
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('lets a User choose a new password with the Password Reset Link', async () => {
    await auth.register(olena);

    await passwordReset.request('OLENA@example.com');
    await passwordReset.reset(tokenFrom(sentLinks[0]), 'battery-staple');

    await expect(
      auth.login(olena.email, olena.password),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect((await auth.login(olena.email, 'battery-staple')).user.email).toBe(
      olena.email,
    );
  });

  it('says nothing and sends nothing for an email that is not registered', async () => {
    await expect(
      passwordReset.request('nobody@example.com'),
    ).resolves.toBeUndefined();

    expect(sentLinks).toEqual([]);
  });

  it('accepts a Password Reset Link only once', async () => {
    await auth.register(olena);
    await passwordReset.request(olena.email);
    const token = tokenFrom(sentLinks[0]);
    await passwordReset.reset(token, 'battery-staple');

    await expect(
      passwordReset.reset(token, 'another-password'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an expired or unknown Password Reset Link', async () => {
    await auth.register(olena);
    await passwordReset.request(olena.email);
    await prisma.passwordResetToken.updateMany({
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    await expect(
      passwordReset.reset(tokenFrom(sentLinks[0]), 'battery-staple'),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      passwordReset.reset('not-a-real-token', 'battery-staple'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('only honours the newest Password Reset Link', async () => {
    await auth.register(olena);
    await passwordReset.request(olena.email);
    await passwordReset.request(olena.email);

    await expect(
      passwordReset.reset(tokenFrom(sentLinks[0]), 'battery-staple'),
    ).rejects.toBeInstanceOf(BadRequestException);
    await passwordReset.reset(tokenFrom(sentLinks[1]), 'battery-staple');
  });

  it('ends the sessions that existed before the password was reset', async () => {
    const { accessToken } = await auth.register(olena);
    await passwordReset.request(olena.email);

    await passwordReset.reset(tokenFrom(sentLinks[0]), 'battery-staple');

    await expect(auth.authenticate(accessToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    const fresh = await auth.login(olena.email, 'battery-staple');
    await expect(auth.authenticate(fresh.accessToken)).resolves.toMatchObject({
      id: fresh.user.id,
    });
  });
});
