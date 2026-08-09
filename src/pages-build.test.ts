import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// @ts-expect-error The Pages assembler is an executable ESM build script.
import { assemblePages } from '../scripts/build-pages.mjs';

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe('GitHub Pages artifact routing', () => {
  it('serves the app at the root and preserves queries through the legacy demo URL', async () => {
    const root = await mkdtemp(join(tmpdir(), 'kanban-pages-'));
    temporaryRoots.push(root);

    const source = join(root, 'dist');
    const output = join(root, 'pages-dist');
    await mkdir(join(source, 'assets'), { recursive: true });
    await writeFile(join(source, 'index.html'), '<main>Kanban app</main>');
    await writeFile(join(source, 'assets', 'app.js'), 'window.__KANBAN_APP__ = true;');

    await assemblePages({
      root,
      output,
      feature: {
        demoOutput: 'dist',
        liveDemoUrl: 'https://kanban.rv-grid.com/',
        title: 'RevoGrid Kanban',
      },
    });

    await expect(readFile(join(output, 'index.html'), 'utf8')).resolves.toContain('Kanban app');
    await expect(readFile(join(output, 'assets', 'app.js'), 'utf8')).resolves.toContain('__KANBAN_APP__');
    await expect(readFile(join(output, 'CNAME'), 'utf8')).resolves.toBe('kanban.rv-grid.com\n');

    const legacyRedirect = await readFile(join(output, 'demo', 'index.html'), 'utf8');
    expect(legacyRedirect).toContain("new URL('../', window.location.href)");
    expect(legacyRedirect).toContain('target.search = window.location.search');
    expect(legacyRedirect).toContain('target.hash = window.location.hash');
    expect(legacyRedirect).toContain('window.location.replace(target)');
    expect(legacyRedirect).not.toContain('url=./demo/');
  });
});
