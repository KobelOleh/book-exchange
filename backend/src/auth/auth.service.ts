import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedUser } from '../common/authenticated-user.js';
import { PublicUser, UsersService } from '../users/users.service.js';

export interface RegisterInput {
  email: string;
  name: string;
  password: string;
}

export interface AuthSession {
  user: PublicUser;
  accessToken: string;
}

interface AccessTokenPayload {
  sub: string;
  /** The User's session version when the token was issued. */
  ver?: number;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(UsersService) private readonly users: UsersService,
    @Inject(JwtService) private readonly jwt: JwtService,
  ) {}

  async register(input: RegisterInput): Promise<AuthSession> {
    const user = await this.users.create(input);
    return this.startSession(user);
  }

  async login(email: string, password: string): Promise<AuthSession> {
    const user = await this.users.verifyCredentials(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.startSession(user);
  }

  async authenticate(accessToken: string): Promise<AuthenticatedUser> {
    const payload = await this.verifyToken(accessToken);

    try {
      const { id, role, sessionVersion } = await this.users.findSession(
        payload.sub,
      );
      if ((payload.ver ?? 0) !== sessionVersion) {
        throw new UnauthorizedException('Session has ended');
      }
      return { id, role };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new UnauthorizedException('User no longer exists');
      }
      throw error;
    }
  }

  private async verifyToken(accessToken: string): Promise<AccessTokenPayload> {
    try {
      return await this.jwt.verifyAsync<AccessTokenPayload>(accessToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private async startSession(user: PublicUser): Promise<AuthSession> {
    const { sessionVersion } = await this.users.findSession(user.id);
    const payload: AccessTokenPayload = { sub: user.id, ver: sessionVersion };
    return { user, accessToken: await this.jwt.signAsync(payload) };
  }
}
