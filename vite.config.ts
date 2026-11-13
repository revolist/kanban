import { defineConfig, searchForWorkspaceRoot } from 'vite';
import { resolve } from 'node:path';
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
export default defineConfig(async ({ mode }) => {
  const packageRoot = resolve(import.meta.dirname, 'package');
  if (!mode.startsWith('package')) {
    return showcaseConfig(mode);
  }
  if (mode === 'package-core-cjs') {
    return {
      root: import.meta.dirname,
      build: {
        emptyOutDir: false,
        outDir: resolve(packageRoot, 'dist'),
        lib: {
          entry: resolve(packageRoot, 'core/index.ts'),
          formats: ['cjs'],
          fileName: () => 'core/index.cjs',
        },
        rolldownOptions: { external: (id) => id.startsWith('@revolist/') },
      },
    };
  }
  if (mode === 'package-umd') {
    return {
      root: import.meta.dirname,
      oxc: { jsx: { runtime: 'automatic', importSource: 'preact' } },
      build: {
        emptyOutDir: false,
        outDir: resolve(packageRoot, 'dist'),
        lib: {
          entry: resolve(packageRoot, 'umd.ts'),
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
      outDir: resolve(packageRoot, 'dist'),
      lib: {
        entry: {
          index: resolve(packageRoot, 'index.ts'),
          core: resolve(packageRoot, 'core/index.ts'),
          ...Object.fromEntries(
            readdirSync(resolve(packageRoot, 'internal'), { recursive: true })
              .filter((file) => /\.tsx?$/.test(String(file)) && !/\.(?:d|test)\.tsx?$/.test(String(file)))
              .map((file) => [
                `internal/${String(file).replace(/\.tsx?$/, '')}`,
                resolve(packageRoot, 'internal', String(file)),
              ]),
          ),
        },
        formats: ['es'],
        cssFileName: 'kanban-community',
      },
      rolldownOptions: {
        external: (id) => id.startsWith('@revolist/') || id === 'preact' || id.startsWith('preact/'),
        output: {
          preserveModules: true,
          preserveModulesRoot: packageRoot,
          entryFileNames: (chunk) => (chunk.name === 'core' ? 'core/index.js' : '[name].js'),
        },
      },
    },
  };
});

async function showcaseConfig(mode: string) {
  // Parent workspaces resolve UI to source; demos consume its published JS surface.
  const uiDist = resolve(import.meta.dirname, 'node_modules/@revolist/ui/dist');
  const uiManifest = resolve(uiDist, 'package.json');
  const uiAliases = existsSync(uiManifest)
    ? Object.fromEntries(
        Object.entries(JSON.parse(readFileSync(uiManifest, 'utf8')).exports)
          .filter(([, value]) => typeof value === 'object' && value !== null && 'import' in value)
          .sort(([a], [b]) => b.length - a.length)
          .map(([key, value]) => [
            key === '.' ? '@revolist/ui' : `@revolist/ui/${key.slice(2)}`,
            resolve(uiDist, (value as { import: string }).import),
          ]),
      )
    : {};

  const [{ default: react }, { default: vue }] = await Promise.all([
    import('@vitejs/plugin-react'),
    import('@vitejs/plugin-vue'),
  ]);
  const angularPlugins = mode === 'angular' ? [(await import('@analogjs/vite-plugin-angular')).default()] : [];
  return {
    base: './',
    server: { fs: { allow: [searchForWorkspaceRoot(resolve(import.meta.dirname, '..'))] } },
    resolve: {
      alias: [
        ...Object.entries(uiAliases).map(([id, replacement]) => ({
          find: new RegExp(`^${id.replaceAll('.', '[.]')}$`),
          replacement,
        })),
        ...(mode === 'test'
          ? [
              {
                find: '@revolist/revogrid-column-date',
                replacement: fileURLToPath(new URL('./tests/revogrid-column-date.stub.ts', import.meta.url)),
              },
            ]
          : []),
      ],
      ...(mode === 'angular' ? { mainFields: ['module'] } : {}),
    },
    plugins: [
      ...angularPlugins,
      react(),
      vue({
        template: {
          compilerOptions: { isCustomElement: (tag) => tag.startsWith('revo-') || tag.startsWith('revogr-') },
        },
      }),
    ],
  };
}
