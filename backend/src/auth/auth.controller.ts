import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';
import type { AuthenticatedUser } from '../common/authenticated-user.js';
import { UpdateProfileDto } from '../users/dto/update-profile.dto.js';
import { Profile, PublicUser, UsersService } from '../users/users.service.js';
import {
  clearAccessTokenCookie,
  setAccessTokenCookie,
} from './access-token-cookie.js';
import { AuthService } from './auth.service.js';
import { CurrentUser } from '../common/current-user.decorator.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { LoginThrottlerGuard } from './login-throttler.guard.js';
import { RegisterDto } from './dto/register.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { PasswordResetService } from './password-reset.service.js';
import { Public } from './public.decorator.js';

/** Reset links one email may request per hour. */
const FORGOT_PASSWORD_LIMIT = 3;

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(UsersService) private readonly users: UsersService,
    @Inject(PasswordResetService)
    private readonly passwordReset: PasswordResetService,
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

  /**
   * Answers the same, and as fast, whether or not the email is registered.
   * Limited per email so nobody can flood a mailbox with reset links.
   */
  @Public()
  @UseGuards(LoginThrottlerGuard)
  @Throttle({ default: { limit: FORGOT_PASSWORD_LIMIT, ttl: 60 * 60_000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  forgotPassword(@Body() { email }: ForgotPasswordDto): void {
    this.passwordReset.requestInBackground(email);
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  resetPassword(@Body() { token, password }: ResetPasswordDto): Promise<void> {
    return this.passwordReset.reset(token, password);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) response: Response): void {
    clearAccessTokenCookie(response);
  }

  @Get('me')
  me(@CurrentUser() actor: AuthenticatedUser): Promise<Profile> {
    return this.users.findProfile(actor.id);
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<Profile> {
    await this.users.updateProfile(actor, dto);
    return this.users.findProfile(actor.id);
  }
}
