import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig(({ mode }) => {
  if (mode === 'core-cjs') {
    return {
      root: import.meta.dirname,
      build: {
        emptyOutDir: false,
        lib: {
          entry: resolve(import.meta.dirname, 'core/index.ts'),
          formats: ['cjs'],
          fileName: () => 'core/index.cjs',
        },
        rolldownOptions: { external: (id) => id.startsWith('@revolist/') },
      },
    };
  }
  if (mode === 'umd') {
    return {
      root: import.meta.dirname,
      oxc: { jsx: { runtime: 'automatic', importSource: 'preact' } },
      build: {
        emptyOutDir: false,
        lib: {
          entry: resolve(import.meta.dirname, 'index.ts'),
          name: 'RevoGridKanbanCommunity',
          formats: ['umd'],
          fileName: () => 'kanban-community.umd.cjs',
          cssFileName: 'kanban-community',
        },
        rolldownOptions: {
          external: (id) => id.startsWith('@revolist/') || id === 'preact' || id.startsWith('preact/'),
          output: {
            globals: (id) =>
              id === '@revolist/revogrid'
                ? 'Revogrid'
                : id === '@revolist/grid-runtime'
                  ? 'RevoGridRuntime'
                  : id.startsWith('@revolist/ui')
                    ? 'RevoUI'
                    : id === 'preact'
                      ? 'preact'
                      : 'preactJsxRuntime',
          },
        },
      },
    };
  }
  return {
    root: import.meta.dirname,
    oxc: { jsx: { runtime: 'automatic', importSource: 'preact' } },
    build: {
      emptyOutDir: false,
      lib: {
        entry: { index: resolve(import.meta.dirname, 'index.ts'), core: resolve(import.meta.dirname, 'core/index.ts') },
        formats: ['es'],
        cssFileName: 'kanban-community',
      },
      rolldownOptions: {
        external: (id) => id.startsWith('@revolist/') || id === 'preact' || id.startsWith('preact/'),
        output: {
          preserveModules: true,
          preserveModulesRoot: import.meta.dirname,
          entryFileNames: (chunk) => (chunk.name === 'core' ? 'core/index.js' : '[name].js'),
        },
      },
    },
  };
});
