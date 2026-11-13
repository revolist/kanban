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
