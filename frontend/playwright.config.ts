import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

const bundledChromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromePath = process.env.PLAYWRIGHT_CHROME_PATH ||
  (existsSync(bundledChromePath) ? bundledChromePath : undefined);

export default defineConfig({
  testDir: './playwright',
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4001',
    browserName: 'chromium',
    headless: true,
    launchOptions: chromePath ? { executablePath: chromePath } : undefined,
  },
});
