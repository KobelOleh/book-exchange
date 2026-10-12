import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Limits login attempts per target account rather than per client address.
 * Behind the Next proxy the real client IP is not reliably available (the
 * forwarded header is client-controlled), but the email being guessed is.
 */
@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected override getTracker(req: Record<string, any>): Promise<string> {
    const email: unknown = req.body?.email;
    return Promise.resolve(
      typeof email === 'string'
        ? `email:${email.trim().toLowerCase()}`
        : String(req.ip),
    );
  }
}
