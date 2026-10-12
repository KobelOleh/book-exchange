import { getTestDatabaseUrl } from './test-database-url.js';

// Runs before every test file: point the app at the test database and make
// the environment independent of a developer's local .env.
process.env.DATABASE_URL = getTestDatabaseUrl();
process.env.JWT_SECRET ??= 'test-only-jwt-secret-with-32-chars-min';
process.env.AUTH_RATE_LIMIT ??= '1000';
process.env.JWT_EXPIRES_IN ??= '1h';
