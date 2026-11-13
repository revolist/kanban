import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';
export default defineConfig(async (env) =>
  mergeConfig(await viteConfig({ ...env, mode: 'test' }), {
    test: {
      name: 'kanban-demo',
      environment: 'jsdom',
      include: ['tests/unit/**/*.test.ts'],
      exclude: ['tests/e2e/**', 'tests/community/**'],
      server: { deps: { inline: true } },
    },
  }),
);
