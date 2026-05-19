import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment variables for the Playwright process itself
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // serial: multiplayer tests share game state
  retries: 1,
  timeout: 30000,
  reporter: [['html', { open: 'never' }], ['line']],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  globalSetup: './tests/setup/global-setup.ts',
  globalTeardown: './tests/setup/global-teardown.ts',

  webServer: {
    // Use dotenv-cli to inject .env.test into the Next.js dev server
    command: 'npx dotenv -e .env.test -- next dev',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    timeout: 60000,
  },
});
