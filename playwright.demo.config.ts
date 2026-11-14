import { defineConfig } from '@playwright/test';

const framework = process.env.KANBAN_E2E_FRAMEWORK ?? 'ts';
if (!['ts', 'react', 'vue', 'angular'].includes(framework)) {
  throw new Error(`Unknown demo framework: ${framework}`);
}
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
    command:
      process.env.KANBAN_E2E_PREVIEW === 'true'
        ? `pnpm exec vite preview --outDir .artifacts/frameworks/${framework} --host 127.0.0.1 --port ${port}`
        : `pnpm exec vite --mode ${framework} --host 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
