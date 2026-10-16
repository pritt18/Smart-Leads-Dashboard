/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  // Run setup before each test file so env vars are in place before any
  // module (including config/env.ts) is imported.
  setupFiles: ['<rootDir>/src/__tests__/helpers/setup.ts'],
  // ts-jest config at the transform level (non-deprecated form)
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          resolveJsonModule: true,
        },
      },
    ],
  },
  // Increase timeout for in-memory MongoDB startup
  testTimeout: 30000,
};
