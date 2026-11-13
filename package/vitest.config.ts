import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    name: '@revolist/kanban-community',
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['dist/**', 'node_modules/**'],
  },
});
