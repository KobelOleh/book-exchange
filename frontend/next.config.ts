import type { NextConfig } from 'next';

const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:4000';

const config: NextConfig = {
  turbopack: { root: import.meta.dirname },
  // The API is proxied through Next so the auth cookie stays same-origin.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${backendUrl}/api/:path*` }];
  },
};

export default config;
