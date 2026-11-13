import { spawnSync } from 'node:child_process';
import { rmSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../', import.meta.url));
rmSync(new URL('../dist/', import.meta.url), { recursive: true, force: true });
for (const [tool, args] of [
  [resolve(dirname(require.resolve('typescript')), '../bin/tsc'), ['-p', 'tsconfig.json']],
  [resolve(dirname(require.resolve('vite/package.json')), 'bin/vite.js'), ['build']],
  [resolve(dirname(require.resolve('vite/package.json')), 'bin/vite.js'), ['build', '--mode', 'umd']],
  [resolve(dirname(require.resolve('vite/package.json')), 'bin/vite.js'), ['build', '--mode', 'core-cjs']],
]) {
  const result = spawnSync(process.execPath, [tool, ...args], { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
const types = new URL('../dist/index.d.ts', import.meta.url);
writeFileSync(types, readFileSync(types, 'utf8').replace(/^import ['"].*\.scss['"];\n/gm, ''));
