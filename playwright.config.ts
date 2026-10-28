import { defineConfig, devices } from '@playwright/test';

/** E2E tests run against the static web export (npm run export:web first), served like GitHub Pages. */
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  fullyParallel: false,
  use: {
    baseURL: 'http://localhost:8091/you-do-you/',
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'phone', use: { ...devices['Pixel 7'], browserName: 'chromium' } }],
  webServer: {
    command: 'node scripts/serve-dist.mjs 8091',
    url: 'http://localhost:8091/you-do-you/',
    reuseExistingServer: !process.env.CI,
  },
});
