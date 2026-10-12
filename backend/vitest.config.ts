import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`.
  plugins: [tsconfigPaths()],
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
