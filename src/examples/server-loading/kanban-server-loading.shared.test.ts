import { describe, expect, it, vi } from 'vitest';
import {
  createKanbanServerConfig,
  KANBAN_SERVER_CARD_COUNT,
  KANBAN_SERVER_PAGE_SIZE,
} from './kanban-server-loading.shared';

describe('Kanban server-loading example', () => {
  it('reports the cards returned by each server page', async () => {
    vi.useFakeTimers();
    try {
      const notify = vi.fn();
      const config = createKanbanServerConfig(notify);
      const request = config.remote.loadData(0, config.remote.chunkSize);

      expect(config.remote.chunkSize).toBe(100);
      expect(config.remote.total).toBe(100_000);
      expect(config.swimlaneField).toBe('team');
      expect(config.swimlaneLayout).toBe('top');
      expect(config.swimlanes).toEqual([
        { id: 'Product', title: 'Product' },
        { id: 'Platform', title: 'Platform' },
        { id: 'Growth', title: 'Growth' },
      ]);
      expect(config.remote.placeholder(0)).toEqual({
        id: 'server-1', title: '', status: 'todo', team: 'Product', order: 1_000,
      });
      expect(config.remote.placeholder(400).team).toBe('Platform');
      expect(config.remote.placeholder(700).team).toBe('Growth');
      expect(notify).toHaveBeenLastCalledWith('Loading cards from server…');
      await vi.advanceTimersByTimeAsync(450);
      const result = await request;

      expect(result.data).toHaveLength(KANBAN_SERVER_PAGE_SIZE);
      expect(result.data[0]).toEqual({
        id: 'server-1', title: 'Server card 1', status: 'todo', team: 'Product', order: 1_000,
      });
      expect(result.data.at(-1)).toEqual({
        id: 'server-100', title: 'Server card 100', status: 'done', team: 'Product', order: 25_000,
      });
      expect(result.total).toBe(KANBAN_SERVER_CARD_COUNT);
      expect(notify).toHaveBeenLastCalledWith(
        'Loaded from server: 100 of 100,000 cards.',
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('uses an uneven deterministic workflow distribution with an almost empty final column', () => {
    const config = createKanbanServerConfig(vi.fn());
    const counts = { todo: 0, doing: 0, review: 0, done: 0 };

    for (let index = 0; index < KANBAN_SERVER_CARD_COUNT; index += 1) {
      counts[config.remote.placeholder(index).status] += 1;
    }

    expect(counts).toEqual({
      todo: 47_500,
      doing: 34_000,
      review: 16_000,
      done: 2_500,
    });
  });

  it('generates the partial final page without allocating the full dataset', async () => {
    vi.useFakeTimers();
    try {
      const notify = vi.fn();
      const config = createKanbanServerConfig(notify);
      const request = config.remote.loadData(99_950, KANBAN_SERVER_PAGE_SIZE);
      await vi.advanceTimersByTimeAsync(450);
      const result = await request;

      expect(result.data).toHaveLength(50);
      expect(result.data[0]?.id).toBe('server-99951');
      expect(result.data.at(-1)?.id).toBe('server-100000');
      expect(result.total).toBe(100_000);
      expect(notify).toHaveBeenLastCalledWith(
        'Loaded from server: 100,000 of 100,000 cards.',
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('reports the last card position returned by the server', async () => {
    vi.useFakeTimers();
    try {
      const notify = vi.fn();
      const config = createKanbanServerConfig(notify);

      const first = config.remote.loadData(0, config.remote.chunkSize);
      await vi.advanceTimersByTimeAsync(450);
      await first;
      const last = config.remote.loadData(99_900, config.remote.chunkSize);
      await vi.advanceTimersByTimeAsync(450);
      await last;

      expect(notify).toHaveBeenLastCalledWith(
        'Loaded from server: 100,000 of 100,000 cards.',
      );

      const refreshed = config.remote.loadData(0, config.remote.chunkSize);
      await vi.advanceTimersByTimeAsync(450);
      await refreshed;
      expect(notify).toHaveBeenLastCalledWith(
        'Loaded from server: 100 of 100,000 cards.',
      );
    } finally {
      vi.useRealTimers();
    }
  });
});
