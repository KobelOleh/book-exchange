import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';
import type { AuthenticatedUser } from '../common/authenticated-user.js';
import { PublicUser, UsersService } from '../users/users.service.js';
import {
  clearAccessTokenCookie,
  setAccessTokenCookie,
} from './access-token-cookie.js';
import { AuthService } from './auth.service.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { LoginThrottlerGuard } from './login-throttler.guard.js';
import { RegisterDto } from './dto/register.dto.js';
import { Public } from './public.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(UsersService) private readonly users: UsersService,
  ) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<PublicUser> {
    const { user, accessToken } = await this.auth.register(dto);
    setAccessTokenCookie(response, accessToken);
    return user;
  }

  @Public()
  @UseGuards(LoginThrottlerGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<PublicUser> {
    const { user, accessToken } = await this.auth.login(
      dto.email,
      dto.password,
    );
    setAccessTokenCookie(response, accessToken);
    return user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) response: Response): void {
    clearAccessTokenCookie(response);
  }

  @Get('me')
  me(@CurrentUser() actor: AuthenticatedUser): Promise<PublicUser> {
    return this.users.findById(actor.id);
  }
}
