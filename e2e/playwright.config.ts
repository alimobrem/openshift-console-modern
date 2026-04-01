import { defineConfig, devices } from 'playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  timeout: 30_000,
  use: {
    baseURL: process.env.PULSE_URL || 'http://localhost:9000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  /* Start dev server before tests if not targeting a deployed instance */
  ...(process.env.PULSE_URL ? {} : {
    webServer: {
      command: 'npm run dev',
      url: 'http://localhost:9000',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  }),
});
