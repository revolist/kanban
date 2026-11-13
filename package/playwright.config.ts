import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:5188', viewport: { width: 1280, height: 850 }, trace: 'retain-on-failure' },
  webServer: {
    command: 'node tests/browser/serve.mjs',
    url: 'http://127.0.0.1:5188/fixture.html',
    reuseExistingServer: false,
  },
});
