import type { Response } from 'express';

export const ACCESS_TOKEN_COOKIE = 'access_token';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
} as const;

export function setAccessTokenCookie(
  response: Response,
  accessToken: string,
): void {
  response.cookie(ACCESS_TOKEN_COOKIE, accessToken, cookieOptions);
}

export function clearAccessTokenCookie(response: Response): void {
  response.clearCookie(ACCESS_TOKEN_COOKIE, cookieOptions);
}
