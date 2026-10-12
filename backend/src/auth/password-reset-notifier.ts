import { Injectable, Logger } from '@nestjs/common';

/** The message a User receives with their Password Reset Link. */
export interface PasswordResetNotification {
  recipient: { name: string; email: string };
  resetLink: string;
}

/** Delivers Password Reset Links. For the demo it writes them to the console. */
@Injectable()
export class PasswordResetNotifier {
  private readonly logger = new Logger(PasswordResetNotifier.name);

  notify({ recipient, resetLink }: PasswordResetNotification): void {
    this.logger.log(
      `Email to ${recipient.email}: ${recipient.name}, reset your password here: ${resetLink}`,
    );
  }
}
