import { describe, it, expect, vi } from 'vitest';
import { KanbanEditorController } from './controller.js';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function editor(onSubmit: () => Promise<void>) {
  const board = {
    getConfig: () => ({ idField: 'id', orderField: 'order' }),
    updateCard: vi.fn(() => ({ ok: true })),
  };
  const state = { mode: 'edit', card: { id: 1 }, draft: { id: 1, title: 'Edited' }, pending: false };
  const instance = Object.assign(Object.create(KanbanEditorController.prototype), {
    contribution: { board: () => board },
    state,
    generation: 1,
    cardIds: [1],
    options: { onSubmit },
    renderEditor: vi.fn(),
    forceClose: vi.fn(),
    runValidation: vi.fn(async () => ({ valid: true, errors: {} })),
  });
  return { instance, board };
}
describe('shared editor async ownership', () => {
  it('commits the same active draft after async validation and submit', async () => {
    const { instance, board } = editor(async () => {});
    await instance.submit();
    expect(board.updateCard).toHaveBeenCalledWith(1, { title: 'Edited' }, { reason: 'editor' });
    expect(instance.forceClose).toHaveBeenCalledOnce();
  });
  it('does not commit or close a later editor when an earlier submit resolves', async () => {
    const pending = deferred<void>();
    const { instance, board } = editor(() => pending.promise);
    const submitted = instance.submit();
    await Promise.resolve();
    instance.generation++;
    const replacement = { mode: 'edit', draft: { id: 2 }, pending: false };
    instance.state = replacement;
    pending.resolve();
    await submitted;
    expect(board.updateCard).not.toHaveBeenCalled();
    expect(instance.forceClose).not.toHaveBeenCalled();
    expect(instance.state).toBe(replacement);
  });
  it('does not reopen after destruction while creating an id', async () => {
    const pending = deferred<number>();
    const { instance, board } = editor(async () => {});
    board.getConfig = () => ({ idField: 'id', orderField: 'order' });
    Object.assign(board, { getCards: () => [] });
    instance.options = { createCardId: () => pending.promise };
    instance.openState = vi.fn();
    const opened = instance.openCreate({});
    instance.disposed = true;
    instance.generation++;
    pending.resolve(3);
    await opened;
    expect(instance.openState).not.toHaveBeenCalled();
  });
});
