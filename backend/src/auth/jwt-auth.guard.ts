import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ACCESS_TOKEN_COOKIE } from './access-token-cookie.js';
import { AuthService } from './auth.service.js';
import { AuthenticatedRequest } from '../common/authenticated-request.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';

/** Requires a valid access token cookie on every route not marked @Public(). */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(AuthService) private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const accessToken: string | undefined =
      request.cookies?.[ACCESS_TOKEN_COOKIE];
    if (!accessToken) {
      throw new UnauthorizedException('Authentication required');
    }

    request.user = await this.auth.authenticate(accessToken);
    return true;
  }
}
