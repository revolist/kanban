import { mkdtempSync, writeFileSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const artifacts = process.env.KANBAN_ARTIFACTS_DIR;
if (!artifacts) {
  throw new Error('Set KANBAN_ARTIFACTS_DIR to the directory containing the public candidate archives.');
}
const root = mkdtempSync(join(tmpdir(), 'kanban-public-consumer-'));
const archives = {
  '@revolist/kanban-community': 'revolist-kanban-community-4.0.9.tgz',
  '@revolist/grid-runtime': 'revolist-grid-runtime-4.0.9.tgz',
  '@revolist/ui': 'revolist-ui-4.0.9.tgz',
};
const dependencies = Object.fromEntries(
  Object.entries(archives).map(([name, file]) => [name, `file:${resolve(artifacts, file)}`]),
);
dependencies['@revolist/revogrid'] = process.env.KANBAN_CORE_VERSION ?? '4.31.4';
writeFileSync(
  join(root, 'package.json'),
  JSON.stringify({ name: 'community-isolated-consumer', private: true, type: 'module', dependencies }),
);
writeFileSync(
  join(root, 'pnpm-workspace.yaml'),
  'packages: []\noverrides:\n' +
    Object.entries(dependencies)
      .filter(([name]) => name !== '@revolist/revogrid')
      .map(([name, value]) => `  ${JSON.stringify(name)}: ${JSON.stringify(value)}\n`)
      .join(''),
);
writeFileSync(join(root, '.npmrc'), 'registry=https://registry.npmjs.org/\n');
const result = spawnSync(
  process.env.npm_execpath ? process.execPath : 'pnpm',
  [
    ...(process.env.npm_execpath ? [process.env.npm_execpath] : []),
    '--dir',
    root,
    'install',
    ...(process.env.KANBAN_ONLINE === '1' ? [] : ['--offline']),
    '--ignore-scripts',
    '--config.manage-package-manager-versions=false',
    ...(process.env.KANBAN_PNPM_STORE ? ['--store-dir', process.env.KANBAN_PNPM_STORE] : []),
  ],
  {
    stdio: 'inherit',
    env: { ...process.env, NODE_AUTH_TOKEN: '', NPM_TOKEN: '', npm_config_userconfig: join(root, '.npmrc') },
  },
);
if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
for (const file of ['fixture.html', 'fixture.ts']) {
  cpSync(fileURLToPath(new URL(`../tests/community/${file}`, import.meta.url)), join(root, file));
}
writeFileSync(fileURLToPath(new URL('../.consumer-path', import.meta.url)), root);
console.log(`Isolated public consumer: ${root}`);
