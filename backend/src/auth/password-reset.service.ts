import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { hashPassword, normalizeEmail } from '../users/users.service.js';
import { PasswordResetNotifier } from './password-reset-notifier.js';

const RESET_LINK_LIFETIME_MS = 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class PasswordResetService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(PasswordResetNotifier)
    private readonly notifier: PasswordResetNotifier,
  ) {}

  /** Sends a Password Reset Link if the email is registered; says nothing either way. */
  async request(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
      select: { id: true, name: true, email: true },
    });
    if (!user) return;

    const token = randomBytes(32).toString('base64url');
    // Only the newest link works: earlier ones are replaced.
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
      this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + RESET_LINK_LIFETIME_MS),
        },
      }),
    ]);

    const frontendUrl = this.config.get<string>(
      'FRONTEND_URL',
      'http://localhost:3100',
    );
    this.notifier.notify({
      recipient: user,
      resetLink: `${frontendUrl}/reset-password?token=${token}`,
    });
  }

  /** Sets a new password and ends every earlier session of that User. */
  async reset(token: string, password: string): Promise<void> {
    const passwordHash = await hashPassword(password);

    const reset = await this.prisma.$transaction(async (tx) => {
      // Marking the link used first makes it single-use even under races.
      const used = await tx.passwordResetToken.updateManyAndReturn({
        where: {
          tokenHash: hashToken(token),
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { usedAt: new Date() },
        select: { userId: true },
      });
      if (used.length === 0) return false;

      await tx.user.update({
        where: { id: used[0].userId },
        data: { passwordHash, sessionVersion: { increment: 1 } },
      });
      return true;
    });

    if (!reset) {
      throw new BadRequestException('Invalid or expired password reset link');
    }
  }
}
