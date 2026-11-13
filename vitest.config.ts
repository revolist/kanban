import { searchForWorkspaceRoot } from 'vite';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
export default defineConfig({
  oxc: { jsx: { runtime: 'automatic', importSource: 'preact' } },
  server: { fs: { allow: [searchForWorkspaceRoot(resolve(import.meta.dirname, '..'))] } },
  test: {
    name: '@revolist/kanban-showcase',
    include: ['package/**/*.test.{ts,tsx}'],
    exclude: ['package/dist/**', '**/node_modules/**'],
  },
});
