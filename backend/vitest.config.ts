import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    passWithNoTests: true,
    globalSetup: ['./test/support/global-setup.ts'],
    setupFiles: ['./test/support/test-environment.ts'],
    // Test files share one database, so they must not run concurrently.
    fileParallelism: false,
  },
});
