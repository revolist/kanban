import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  kanbanIdKey,
  writeKanbanFields,
  allocateFractionalRanks,
  updateKanbanSelection,
} from '../package/dist/core/index.js';

test('numeric and text identities remain distinct', () => {
  assert.notEqual(kanbanIdKey(1), kanbanIdKey('1'));
});
test('a field patch preserves application metadata', () => {
  const metadata = { lane: 'owned-by-application', nested: { value: 3 } };
  const source = { id: 1, status: 'todo', metadata };
  const next = writeKanbanFields(source, new Map([['status', 'done']]));
  assert.equal(source.status, 'todo');
  assert.equal(next.status, 'done');
  assert.equal(next.metadata, metadata);
});
test('unrepresentable ranks request rebalance instead of duplicate ordering', () => {
  assert.equal(allocateFractionalRanks({ beforeRank: 1, afterRank: 1 + Number.EPSILON, count: 2 }), undefined);
});
test('range selection preserves board ordering', () => {
  assert.deepEqual(
    updateKanbanSelection({ currentIds: [1], cardId: 3, anchorId: 1, mode: 'range', orderedCardIds: [1, 2, 3] }),
    [1, 2, 3],
  );
});
test('emitted core has no commercial imports or feature implementations', () => {
  const directory = fileURLToPath(new URL('../package/dist/core/', import.meta.url));
  for (const file of readdirSync(directory).filter((file) => file.endsWith('.js'))) {
    const code = readFileSync(`${directory}/${file}`, 'utf8');
    assert.doesNotMatch(
      code,
      /revogrid-pro|kanban-trial|trialControl|registerLicense|HistoryPlugin|ContextMenuPlugin|SwimlaneGroupRowRenderer/,
    );
  }
});

test('CommonJS core loads without document or browser dependencies', async () => {
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const core = require('../package/dist/core/index.cjs');
  assert.equal(typeof core.KanbanBoardController, 'function');
  assert.equal(core.kanbanIdKey(1), kanbanIdKey(1));
});

test('every Community output excludes commercial engines, shortcuts, controls and styles', () => {
  const root = fileURLToPath(new URL('../package/dist/', import.meta.url));
  const entries = readdirSync(root, { recursive: true }).filter((file) => /\.(?:[cm]?js|css|d\.ts)$/.test(file));
  assert(entries.length > 10);
  for (const file of entries) {
    const code = readFileSync(`${root}/${file}`, 'utf8');
    assert.doesNotMatch(code, /@revolist\/(?:revogrid-pro|kanban-trial|trial-control|dates|data-query)/, file);
    assert.doesNotMatch(
      code,
      /trialControl|registerLicense|HistoryPlugin|ContextMenuPlugin|SwimlaneGroupRowRenderer/,
      file,
    );
    assert.doesNotMatch(code, /kanban-toolbar__history|externalProjection|externalEditor|externalToolbar/, file);
    assert.doesNotMatch(code, /rv-history-controls|kanban-swimlane|kanban-context-menu|beforehistedit/, file);
  }
});

test('package contains source and publish metadata without a development environment', () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const entries = readdirSync(`${root}/package`);
  assert.doesNotMatch(entries.join('\n'), /(?:config\.|tsconfig|eslint|prettier|pnpm-workspace|^scripts$|^tests$)/m);
  const manifest = JSON.parse(readFileSync(`${root}/package/package.json`, 'utf8'));
  for (const key of ['scripts', 'devDependencies', 'packageManager', 'engines']) {
    assert.equal(manifest[key], undefined, `${key} belongs to the repository root`);
  }
});

test('root owns separate package and showcase commands and configurations', () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const manifest = JSON.parse(readFileSync(`${root}/package.json`, 'utf8'));
  assert.equal(manifest.private, true);
  assert.equal(manifest.scripts.build, 'node scripts/build-package.mjs');
  assert.equal(manifest.scripts['build:demo'], 'pnpm build:ts');
  assert.equal(manifest.scripts['preview:demo'], 'vite preview');
  for (const file of [
    'vite.config.ts',
    'vitest.config.ts',
    'tsconfig.package.json',
    'playwright.config.ts',
    'playwright.demo.config.ts',
    'eslint.config.mjs',
    '.prettierrc.json',
  ]) {
    assert(readFileSync(`${root}/${file}`).length > 0, file);
  }
});
