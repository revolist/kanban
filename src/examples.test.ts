import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_KANBAN_EXAMPLE_ID,
  KANBAN_EXAMPLES,
  KANBAN_EXAMPLE_IDS,
  resolveKanbanExample,
} from './examples';

describe('Kanban example registry', () => {
  it('keeps the classic showcase as the default for missing and unknown example ids', () => {
    expect(resolveKanbanExample('').id).toBe(DEFAULT_KANBAN_EXAMPLE_ID);
    expect(resolveKanbanExample('?example=unknown').id).toBe(DEFAULT_KANBAN_EXAMPLE_ID);
  });

  it('keeps every classic framework loader registered', () => {
    const example = resolveKanbanExample('?example=showcase');

    expect(example).toBe(KANBAN_EXAMPLES.showcase);
    expect(example.angularSelector).toBe('kanban-showcase-grid');
    expect(typeof example.loadTs).toBe('function');
    expect(typeof example.loadReact).toBe('function');
    expect(typeof example.loadVue).toBe('function');
    expect(typeof example.loadAngular).toBe('function');
  });

  it('registers every framework loader for the performance board', () => {
    const example = resolveKanbanExample('?example=performance');

    expect(example).toBe(KANBAN_EXAMPLES.performance);
    expect(example.angularSelector).toBe('kanban-board-grid');
    expect(KANBAN_EXAMPLE_IDS).toEqual(['showcase', 'performance', 'server-loading']);
    expect(typeof example.loadTs).toBe('function');
    expect(typeof example.loadReact).toBe('function');
    expect(typeof example.loadVue).toBe('function');
    expect(typeof example.loadAngular).toBe('function');
  });

  it('registers every framework loader for server loading', () => {
    const example = resolveKanbanExample('?example=server-loading');

    expect(example).toBe(KANBAN_EXAMPLES['server-loading']);
    expect(example.angularSelector).toBe('kanban-server-loading-grid');
    expect(typeof example.loadTs).toBe('function');
    expect(typeof example.loadReact).toBe('function');
    expect(typeof example.loadVue).toBe('function');
    expect(typeof example.loadAngular).toBe('function');
  });
});

describe('Kanban showcase card layout', () => {
  it('pins the ticket ID to the first row opposite the priority badge', () => {
    const template = readFileSync(new URL('./examples/showcase/kanban.shared.ts', import.meta.url), 'utf8');
    const styles = readFileSync(new URL('./examples/showcase/kanban.scss', import.meta.url), 'utf8');

    expect(template).toMatch(/class: 'kanban-showcase-card-topline' \}, \[\s*card\.id,\s*h\('span', \{ class: `kanban-showcase-priority/s);
    expect(template).not.toContain("class: 'kanban-showcase-card-id'");
    expect(styles).toMatch(/\.kanban-showcase-card-content\s*\{[^}]*grid-template-rows:\s*20px 20px auto auto 30px minmax\(26px, 1fr\);[^}]*gap:\s*5px;/s);
    expect(styles).toMatch(/\.kanban-showcase-card-topline\s*\{[^}]*display:\s*flex\s*!important;[^}]*grid-row:\s*1;[^}]*color:\s*#8a94a6;/s);
    expect(styles).toMatch(/\.kanban-showcase-priority\s*\{[^}]*margin-inline-start:\s*auto;/s);
    expect(styles).toMatch(/\.kanban-showcase-card-meta\s*\{[^}]*padding-block-end:\s*2px;/s);
    expect(styles).toMatch(/\.kanban-showcase-avatar-stack\s*\{[^}]*height:\s*20px\s*!important;/s);
  });
});
