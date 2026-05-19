import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest-setup.ts'],
  // Match any .test.ts file inside the tests/ directory
  testRegex: 'tests/(unit|api)/.*\\.test\\.ts$',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
      }
    }]
  },
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};

export default config;
