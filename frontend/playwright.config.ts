import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

const bundledChromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromePath = process.env.PLAYWRIGHT_CHROME_PATH ||
  (existsSync(bundledChromePath) ? bundledChromePath : undefined);

export default defineConfig({
  testDir: './playwright',
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4001',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        browserName: 'chromium',
        launchOptions: chromePath ? { executablePath: chromePath } : undefined,
      },
    },
    {
      // Safari/WebKit lacks requestIdleCallback in some builds; catch blank-screen
      // regressions that Chromium mobile emulation does not reproduce.
      name: 'webkit',
      use: {
        ...devices['iPhone 12'],
        browserName: 'webkit',
      },
      testMatch: '**/mobile_trace.spec.ts',
    },
  ],
});
