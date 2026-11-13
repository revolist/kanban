import { spawnSync } from 'node:child_process';
import { rmSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../', import.meta.url));
rmSync(new URL('../package/dist/', import.meta.url), { recursive: true, force: true });
for (const [tool, args] of [
  [resolve(dirname(require.resolve('typescript')), '../bin/tsc'), ['-p', 'tsconfig.package.json']],
  [resolve(dirname(require.resolve('vite/package.json')), 'bin/vite.js'), ['build', '--mode', 'package']],
  [resolve(dirname(require.resolve('vite/package.json')), 'bin/vite.js'), ['build', '--mode', 'package-umd']],
  [resolve(dirname(require.resolve('vite/package.json')), 'bin/vite.js'), ['build', '--mode', 'package-core-cjs']],
]) {
  const result = spawnSync(process.execPath, [tool, ...args], { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
const types = new URL('../package/dist/index.d.ts', import.meta.url);
writeFileSync(types, readFileSync(types, 'utf8').replace(/^import ['"].*\.scss['"];\n/gm, ''));

writeFileSync(
  new URL('../package/dist/editor.scss', import.meta.url),
  readFileSync(new URL('../package/internal/editor/styles.scss', import.meta.url)),
);

writeFileSync(
  new URL('../package/dist/toolbar.scss', import.meta.url),
  readFileSync(new URL('../package/internal/toolbar/styles.scss', import.meta.url)),
);

writeFileSync(
  new URL('../package/dist/FontAwesome-LICENSE.txt', import.meta.url),
  readFileSync(require.resolve('@fortawesome/fontawesome-free/LICENSE.txt')),
);
