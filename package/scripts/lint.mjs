import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
const require = createRequire(import.meta.url);
for (const [tool, args] of [
  [resolve(dirname(require.resolve('typescript')), '../bin/tsc'), ['-p', 'tsconfig.json', '--noEmit']],
  [resolve(dirname(require.resolve('eslint/package.json')), 'bin/eslint.js'), ['.']],
]) {
  const result = spawnSync(process.execPath, [tool, ...args], { stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
