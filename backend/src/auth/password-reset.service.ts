import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
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
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(PasswordResetNotifier)
    private readonly notifier: PasswordResetNotifier,
  ) {}

  /**
   * Starts a reset without making the caller wait for it. Registered and
   * unregistered emails therefore take the same time to answer, so response
   * timing cannot reveal which emails have an account.
   */
  requestInBackground(email: string): void {
    this.request(email).catch((error: unknown) => {
      this.logger.error('Password reset request failed', error);
    });
  }

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
      this.prisma.passwordResetLink.deleteMany({ where: { userId: user.id } }),
      this.prisma.passwordResetLink.create({
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
    const tokenHash = hashToken(token);
    const validLink = () => ({
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    });
    // Cheap check first, so bogus links do not cost a password hash each.
    if (
      !(await this.prisma.passwordResetLink.findFirst({
        where: validLink(),
      }))
    ) {
      throw new BadRequestException('Invalid or expired password reset link');
    }
    const passwordHash = await hashPassword(password);

    const reset = await this.prisma.$transaction(async (tx) => {
      // Marking the link used first makes it single-use even under races.
      const used = await tx.passwordResetLink.updateManyAndReturn({
        where: validLink(),
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
