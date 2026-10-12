import { getTestDatabaseUrl } from './test-database-url.js';

// Runs before every test file: point the app at the test database.
process.env.DATABASE_URL = getTestDatabaseUrl();
