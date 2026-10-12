import 'dotenv/config';

const TEST_DATABASE_SUFFIX = '_test';

/**
 * Derives the test database URL from DATABASE_URL by suffixing the database
 * name, so tests can never touch the development database.
 */
export function getTestDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error('DATABASE_URL must be set to derive the test database');
  }

  const url = new URL(baseUrl);
  if (!url.pathname.endsWith(TEST_DATABASE_SUFFIX)) {
    url.pathname += TEST_DATABASE_SUFFIX;
  }
  return url.toString();
}
