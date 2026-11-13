import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const [runtime = '../runtime', ui = '../ui'] = process.argv.slice(2);
for (const path of [runtime, ui]) {
  JSON.parse(readFileSync(resolve(path, 'package.json'), 'utf8'));
}
const path = 'pnpm-workspace.yaml';
let config = readFileSync(path, 'utf8');
const packages = [runtime, ui, `${ui}/internal/*`].filter((entry) => !config.includes(`  - ${entry}\n`));
if (packages.length) {
  config = config.replace('  - "package"', `  - "package"\n${packages.map((entry) => `  - ${entry}`).join('\n')}`);
}
for (const name of ['grid-runtime', 'ui']) {
  const key = `@revolist/kanban-community>@revolist/${name}`;
  if (!config.includes(`'${key}':`)) {
    config = config.replace('overrides:\n', `overrides:\n  '${key}': 'workspace:*'\n`);
  }
}
writeFileSync(path, config);
