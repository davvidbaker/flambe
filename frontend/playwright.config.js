const { defineConfig } = require('@playwright/test');
const { existsSync } = require('node:fs');

const bundledChromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromePath = process.env.PLAYWRIGHT_CHROME_PATH ||
  (existsSync(bundledChromePath) ? bundledChromePath : undefined);

module.exports = defineConfig({
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
