import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ACCESS_TOKEN_COOKIE = 'access_token';
const PUBLIC_PATHS = ['/login', '/register'];

/**
 * Sends visitors without an access-token cookie to the login page. This is
 * only a convenience: the backend still verifies the token on every API call.
 */
export function proxy(request: NextRequest) {
  const isPublic = PUBLIC_PATHS.includes(request.nextUrl.pathname);

  if (!request.cookies.has(ACCESS_TOKEN_COOKIE) && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
