import { defineConfig } from '@playwright/test';

const port = Number(process.env.KANBAN_E2E_PORT ?? 4173);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL,
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
  },
  webServer: {
    command: `pnpm exec vite --mode ts --host 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
