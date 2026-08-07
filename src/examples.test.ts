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
    expect(KANBAN_EXAMPLE_IDS).toEqual(['showcase', 'performance']);
    expect(typeof example.loadTs).toBe('function');
    expect(typeof example.loadReact).toBe('function');
    expect(typeof example.loadVue).toBe('function');
    expect(typeof example.loadAngular).toBe('function');
  });
});
