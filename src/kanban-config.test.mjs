import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(
  new URL('./kanban.shared.ts', import.meta.url),
  'utf8',
);
const styles = await readFile(
  new URL('./kanban.scss', import.meta.url),
  'utf8',
);
const frameworkSources = await Promise.all([
  'kanban.ts',
  'kanban.react.tsx',
  'kanban.vue',
  'kanban.angular.ts',
].map((file) => readFile(new URL(`./${file}`, import.meta.url), 'utf8')));

test('the Kanban projection explicitly maps card identity, column, and order fields', () => {
  assert.match(source, /idField:\s*['"]id['"]/);
  assert.match(source, /columnField:\s*['"]status['"]/);
  assert.match(source, /orderField:\s*['"]order['"]/);
  assert.match(source, /\{\s*prop:\s*['"]backlog['"],\s*name:\s*['"]Backlog['"]/);
  assert.doesNotMatch(source, /\{\s*id:\s*['"]backlog['"]/);
});

test('card content resets inherited full-height sizing on each grid row', () => {
  assert.match(
    styles,
    /\.kanban-showcase-card-content\s*>\s*\*\s*\{[^}]*height:\s*auto\s*!important;/s,
  );
  assert.match(
    styles,
    /\.kanban-showcase-card-id,[^}]*\.kanban-showcase-points\s*\{[^}]*height:\s*auto\s*!important;/s,
  );
});

test('showcase cards include realistic ownership, delivery, and activity data', () => {
  assert.match(source, /assignees:\s*string\[\]/);
  assert.match(source, /progress:\s*number/);
  assert.match(source, /dueDate:\s*string/);
  assert.match(source, /comments:\s*number/);
  assert.match(source, /attachments:\s*number/);
  assert.match(source, /kanban-showcase-avatar-stack/);
  assert.match(source, /kanban-showcase-progress__bar/);
  assert.match(source, /kanban-showcase-activity/);
});

test('every framework variant follows explicit host theme changes', () => {
  frameworkSources.forEach((frameworkSource) => {
    assert.match(frameworkSource, /observeCurrentTheme/);
    assert.match(frameworkSource, /darkCompact/);
    assert.match(frameworkSource, /compact/);
  });
});

test('the system dark-mode fallback does not override an explicit host theme', () => {
  const fallback = styles.match(/@media \(prefers-color-scheme: dark\) \{([\s\S]*?)\n\}/)?.[1] ?? '';
  assert.match(fallback, /html:not\(\[data-theme\]\):not\(\.light\) \.kanban-showcase/);
  assert.doesNotMatch(fallback, /(?:^|\n)\s*\.kanban-showcase/);
});
