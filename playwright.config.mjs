import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3005',
    browserName: 'chromium',
    headless: true,
    screenshot: 'off',
  },
  webServer: {
    command: 'node scripts/server.js',
    port: 3005,
    reuseExistingServer: true,
    timeout: 15000,
  },
  outputDir: './test-results',
});
