import { describe, expect, it, vi } from 'vitest';
import { KanbanBoardController } from './controller.js';
import type { KanbanConfig } from './types.js';
interface Card {
  id: string | number;
  title: string;
  status: string;
  order: number;
  metadata?: object;
}
const cards = (): Card[] => [
  { id: 'a', title: 'First', status: 'todo', order: 1024, metadata: { source: 'application' } },
  { id: 'b', title: 'Second', status: 'todo', order: 2048 },
  { id: 'c', title: 'Third', status: 'done', order: 1024 },
];
const config = (): KanbanConfig<Card> => ({ columns: [{ prop: 'todo' }, { prop: 'done', wipLimit: 2 }] });
describe('Community canonical board', () => {
  it('preserves source metadata and immutable identity through editor-style updates', () => {
    const source = cards();
    const board = new KanbanBoardController(source, config());
    expect(board.updateCard('a', { title: 'Changed' }).ok).toBe(true);
    expect(source[0].title).toBe('First');
    expect(board.getCards()[0].metadata).toBe(source[0].metadata);
    expect(board.updateCard('a', { id: 'other' }).ok).toBe(false);
  });
  it('creates, deletes and reloads application-owned records', () => {
    const board = new KanbanBoardController(cards(), config());
    expect(board.createCard({ id: 42, title: 'New', status: 'todo', order: 0 }).ok).toBe(true);
    expect(board.deleteCards(['a', 42])).toMatchObject({
      ok: true,
      cards: [expect.objectContaining({ id: 'a' }), expect.objectContaining({ id: 42 })],
    });
    const restored = new KanbanBoardController(JSON.parse(JSON.stringify(board.getCards())), config());
    expect(restored.getCards().map((card) => card.id)).toEqual(['b', 'c']);
  });
  it('rejects duplicate create identity while keeping numeric and text ids distinct', () => {
    const board = new KanbanBoardController(cards(), config());
    expect(board.createCard({ id: 'a', title: 'Duplicate', status: 'todo', order: 0 }).ok).toBe(false);
    expect(board.createCard({ id: 1, title: 'Number', status: 'todo', order: 0 }).ok).toBe(true);
    expect(board.createCard({ id: '1', title: 'Text', status: 'todo', order: 0 }).ok).toBe(true);
  });
  it('rejects ambiguous existing identities from interactive projection', () => {
    const source = cards();
    source.push({ ...source[0] });
    const board = new KanbanBoardController(source, config());
    expect(board.getProjection().cardById.has('a')).toBe(false);
    expect(board.moveCards(['a'], { columnProp: 'done' }).ok).toBe(false);
    expect(board.updateCard('a', { title: 'Ambiguous' }).ok).toBe(false);
    expect(board.deleteCards(['a']).ok).toBe(false);
  });
  it('commits a selected move atomically in selection order', () => {
    const committed = vi.fn();
    const board = new KanbanBoardController(cards(), config(), undefined, committed);
    expect(board.moveCards(['b', 'a'], { columnProp: 'done', index: 0 }).ok).toBe(true);
    expect(committed).toHaveBeenCalledTimes(1);
    expect(
      board
        .getProjection()
        .cards.filter((card) => card.location.columnProp === 'done')
        .map((card) => card.id),
    ).toEqual(['b', 'a', 'c']);
  });
  it('blocks WIP using the complete source including filtered records', () => {
    const board = new KanbanBoardController(cards(), { ...config(), wipBehavior: 'block', filter: { query: 'First' } });
    expect(board.moveCards(['a', 'b'], { columnProp: 'done' }).ok).toBe(false);
    expect(board.getCards().map((card) => card.status)).toEqual(['todo', 'todo', 'done']);
  });
  it('permits over-limit placement under warning policy', () => {
    const board = new KanbanBoardController(cards(), { ...config(), wipBehavior: 'warn' });
    expect(board.moveCards(['a', 'b'], { columnProp: 'done' }).ok).toBe(true);
  });
  it('does not emit an order-preserving move or empty update', () => {
    const committed = vi.fn();
    const board = new KanbanBoardController(cards(), config(), undefined, committed);
    expect(board.moveCards(['a'], { columnProp: 'todo', index: 0 }).ok).toBe(true);
    expect(board.updateCard('a', { title: 'First' }).ok).toBe(true);
    expect(committed).not.toHaveBeenCalled();
  });
  it('honors cancellation and detects reentrant source replacement', () => {
    const before = vi.fn(() => false);
    const board = new KanbanBoardController(cards(), config(), before);
    expect(board.deleteCards(['a']).ok).toBe(false);
    expect(board.getCards()).toHaveLength(3);
    const replacement = cards().slice(1);
    let reentrant: KanbanBoardController<Card>;
    reentrant = new KanbanBoardController(cards(), config(), () => {
      reentrant.replace(replacement);
      return true;
    });
    expect(reentrant.updateCard('a', { title: 'Lost' }).ok).toBe(false);
    expect(reentrant.getCards()).toEqual(replacement);
  });
  it('enforces readonly and custom transition callbacks', () => {
    const readonly = new KanbanBoardController(cards(), { ...config(), readOnly: true });
    expect(readonly.deleteCards(['a']).ok).toBe(false);
    const board = new KanbanBoardController(cards(), { ...config(), rules: { canDrop: () => 'Host rejected' } });
    expect(board.moveCards(['a'], { columnProp: 'done' })).toMatchObject({ ok: false, reason: 'Host rejected' });
  });
  it('uses translated diagnostics and rejects explicitly requested unsupported features', () => {
    const base = {
      ...config(),
      labels: { invalid: 'Identidade inválida', unsupported: (feature: string) => `Indisponível: ${feature}` },
    };
    const board = new KanbanBoardController(cards(), base);
    expect(board.createCard({ id: 'a', title: '', status: 'todo', order: 0 })).toMatchObject({
      reason: 'Identidade inválida',
    });
    for (const feature of ['history', 'swimlanes', 'contextMenu', 'persistence', 'remote']) {
      expect(() => board.configure({ ...base, [feature]: {} })).toThrow(`Indisponível: ${feature}`);
    }
  });
  it('searches locally while retaining the complete canonical source', () => {
    const board = new KanbanBoardController(cards(), { ...config(), filter: { query: 'SECOND' } });
    expect([...board.getProjection().visibleCardIds]).toEqual(['b']);
    expect(board.getCards()).toHaveLength(3);
  });
});

it('runs the same commit fence for all mutation actions', () => {
  for (const action of ['create', 'update', 'delete', 'move'] as const) {
    let board: KanbanBoardController<Card>;
    const committed = vi.fn();
    board = new KanbanBoardController(
      cards(),
      config(),
      () => {
        board.replace([{ id: 'new-source', title: 'New source', status: 'todo', order: 1024 }]);
        return true;
      },
      committed,
    );
    const result =
      action === 'create'
        ? board.createCard({ id: 'd', title: 'New', status: 'todo', order: 0 })
        : action === 'update'
          ? board.updateCard('a', { title: 'Changed' })
          : action === 'delete'
            ? board.deleteCards(['a'])
            : board.moveCards(['a'], { columnProp: 'done' });
    expect(result).toMatchObject({ ok: false, code: 'stale' });
    expect(committed).not.toHaveBeenCalled();
    expect(board.getCards().map((card) => card.id)).toEqual(['new-source']);
  }
});

describe('review regressions', () => {
  it('plans cancelled moves without writing speculative records to the source owner', () => {
    let records = cards();
    const write = vi.fn((next: readonly Card[]) => {
      records = next as Card[];
    });
    const board = new KanbanBoardController(records, config(), () => false, undefined, {
      read: () => records,
      write,
    });
    write.mockClear();
    expect(board.moveCards(['a'], { columnProp: 'done' }).ok).toBe(false);
    expect(write).not.toHaveBeenCalled();
    expect(records[0].status).toBe('todo');
  });
  it('applies a requested placement when updating without changing a protected field', () => {
    const board = new KanbanBoardController(cards(), config());
    expect(board.updateCard('a', { title: 'Moved' }, { columnProp: 'done' }).ok).toBe(true);
    expect(board.getCards()[0]).toMatchObject({ status: 'done', title: 'Moved' });
  });
});

it('rejects exhausted append ranks without introducing duplicate ordering', () => {
  const board = new KanbanBoardController([{ id: 'a', status: 'todo', title: 'Existing', order: Number.MAX_VALUE }], {
    columns: [{ prop: 'todo' }],
    labels: { rankExhausted: 'Ordem esgotada' },
  });
  expect(board.createCard({ id: 'b', status: 'todo', title: 'New', order: 0 })).toMatchObject({
    ok: false,
    code: 'rank-exhausted',
    reason: 'Ordem esgotada',
  });
  expect(board.getCards()).toHaveLength(1);
});

it('keeps unique identities, finite ranks and metadata through a sequence of batch moves', () => {
  const original = Array.from({ length: 20 }, (_, id) => ({
    id,
    title: `Card ${id}`,
    status: 'todo',
    order: (id + 1) * 1024,
    metadata: { source: id },
  }));
  const board = new KanbanBoardController(original, { columns: [{ prop: 'todo' }, { prop: 'done' }] });
  for (let step = 0; step < 80; step++) {
    expect(
      board.moveCards([step % 20, (step + 7) % 20], {
        columnProp: step % 2 ? 'todo' : 'done',
        index: step % 6,
      }).ok,
    ).toBe(true);
    expect(new Set(board.getCards().map((card) => card.id)).size).toBe(20);
    for (const prop of ['todo', 'done']) {
      const bucket = board.getProjection().cards.filter((card) => card.location.columnProp === prop);
      expect(new Set(bucket.map((card) => card.location.rank)).size).toBe(bucket.length);
      expect(bucket.every((card) => Number.isFinite(card.location.rank))).toBe(true);
    }
  }
  expect(original.every((card) => card.status === 'todo')).toBe(true);
  expect(board.getCards().every((card) => card.metadata === original[card.id].metadata)).toBe(true);
});

it('preserves host source replacement during placement validation instead of overwriting it', () => {
  const replacement = cards();
  replacement[0].title = 'Host update';
  let board: KanbanBoardController<Card>;
  board = new KanbanBoardController(cards(), {
    ...config(),
    rules: {
      canDrop: () => {
        board.replace(replacement);
        return true;
      },
    },
  });
  expect(board.updateCard('a', { status: 'done' })).toMatchObject({ ok: false, code: 'stale' });
  expect(board.getCards()).toEqual(replacement);
});

it('rejects unsupported configuration before writing to an external source owner', () => {
  const write = vi.fn();
  expect(
    () =>
      new KanbanBoardController(cards(), { ...config(), history: true } as KanbanConfig<Card>, undefined, undefined, {
        read: cards,
        write,
      }),
  ).toThrow();
  expect(write).not.toHaveBeenCalled();
});
