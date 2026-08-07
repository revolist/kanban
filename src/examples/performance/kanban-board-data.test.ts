import { describe, expect, it } from 'vitest';
import {
  createKanbanBoardConfig,
  createKanbanBoardRows,
  KANBAN_BOARD_ITEM_COUNT,
} from './kanban-board-data';

describe('50K cards board fixture', () => {
  it('creates 50,000 unique cards evenly across the workflow and swimlanes', () => {
    const rows = createKanbanBoardRows();
    const statusCounts = new Map<string, number>();
    const teamCounts = new Map<string, number>();

    for (const row of rows) {
      statusCounts.set(row.status, (statusCounts.get(row.status) ?? 0) + 1);
      teamCounts.set(row.team, (teamCounts.get(row.team) ?? 0) + 1);
    }

    expect(rows).toHaveLength(KANBAN_BOARD_ITEM_COUNT);
    expect(new Set(rows.map(({ id }) => id)).size).toBe(KANBAN_BOARD_ITEM_COUNT);
    expect([...statusCounts.values()]).toEqual(Array(10).fill(5_000));
    expect(teamCounts).toEqual(new Map([['Product', 25_000], ['Platform', 25_000]]));
  });

  it('registers 10 workflow columns against the source-backed status field', () => {
    const config = createKanbanBoardConfig();

    expect(config.columns).toHaveLength(10);
    expect(config.columnField).toBeUndefined();
    expect(config.swimlaneField).toBe('team');
    expect(config.cardRowHeight).toBe(190);
  });
});
