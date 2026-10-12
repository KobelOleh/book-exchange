import { execSync } from 'node:child_process';
import pg from 'pg';
import { getTestDatabaseUrl } from './test-database-url.js';

/** Creates the test database if needed and brings it to the latest migration. */
export default async function setup() {
  const testUrl = new URL(getTestDatabaseUrl());
  const databaseName = testUrl.pathname.slice(1);

  const adminUrl = new URL(testUrl);
  adminUrl.pathname = '/postgres';
  const admin = new pg.Client({ connectionString: adminUrl.toString() });

  await admin.connect();
  try {
    const { rowCount } = await admin.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [databaseName],
    );
    if (!rowCount) {
      await admin.query(`CREATE DATABASE "${databaseName}"`);
    }
  } finally {
    await admin.end();
  }

  execSync('npx prisma migrate deploy', {
    stdio: 'ignore',
    env: { ...process.env, DATABASE_URL: testUrl.toString() },
  });
}
