import { describe, expect, it, vi } from 'vitest';
import type { PluginProviders } from '@revolist/revogrid';
import { KanbanPlugin } from '@revolist/kanban';
import { KanbanShowcaseActionsPlugin } from '../../../src/examples/showcase/kanban.actions';

function fixture() {
  const wrapper = document.createElement('div');
  const grid = document.createElement('revo-grid') as HTMLRevoGridElement;
  wrapper.append(grid);
  document.body.append(wrapper);
  const state = { cards: [{ id: 'one' }], selected: [] as string[], undo: false, redo: false };
  const kanban = {
    getCards: () => state.cards, getSelectedCardIds: () => state.selected,
    requestCreateCard: vi.fn(), requestEditCard: vi.fn(), requestDeleteCards: vi.fn(),
  };
  const history = { canUndo: () => state.undo, canRedo: () => state.redo, undo: vi.fn(), redo: vi.fn() };
  const providers = { plugins: { get: () => [kanban, history], getByClass: (type: unknown) => type === KanbanPlugin ? kanban : undefined } } as unknown as PluginProviders;
  const plugin = new KanbanShowcaseActionsPlugin(grid, providers);
  const button = (action: string) => wrapper.querySelector<HTMLButtonElement>(`[data-kanban-action="${action}"]`)!;
  const refresh = async (name: string) => { grid.dispatchEvent(new CustomEvent(name)); await Promise.resolve(); };
  const dispose = () => { plugin.destroy(); wrapper.remove(); };
  return { wrapper, grid, state, kanban, history, plugin, button, refresh, dispose };
}

describe('showcase card actions', () => {
  it('uses canonical selection and history availability and dispatches existing APIs', async () => {
    const f = fixture();
    try {
      await Promise.resolve();
      expect(f.button('add').disabled).toBe(false);
      for (const action of ['edit', 'delete', 'undo', 'redo']) expect(f.button(action).disabled).toBe(true);
      f.state.selected = ['one'];
      f.state.undo = true;
      await f.refresh('kanbanselectionchange');
      f.button('add').click(); f.button('edit').click(); f.button('delete').click(); f.button('undo').click();
      expect(f.kanban.requestCreateCard).toHaveBeenCalledOnce();
      expect(f.kanban.requestEditCard).toHaveBeenCalledWith('one');
      expect(f.kanban.requestDeleteCards).toHaveBeenCalledWith(['one']);
      expect(f.history.undo).toHaveBeenCalledOnce();
      f.state.redo = true; f.state.undo = false;
      await f.refresh('historychanged');
      expect(f.button('undo').disabled).toBe(true);
      f.button('redo').click();
      expect(f.history.redo).toHaveBeenCalledOnce();
      f.state.selected = ['one', 'two'];
      await f.refresh('kanbanselectionchange');
      expect(f.button('edit').disabled).toBe(true);
      expect(f.button('delete').disabled).toBe(false);
    } finally { f.dispose(); }
  });

  it('offers first-card creation after an empty source replacement and hides it after creation', async () => {
    const f = fixture();
    try {
      f.state.cards = [];
      await f.refresh('aftersourceset');
      const empty = f.wrapper.querySelector<HTMLElement>('.kanban-showcase-actions__empty')!;
      expect(empty.hidden).toBe(false);
      empty.querySelector('button')!.click();
      expect(f.kanban.requestCreateCard).toHaveBeenCalledOnce();
      f.state.cards = [{ id: 'new' }];
      await f.refresh('kanban-card-change');
      expect(empty.hidden).toBe(true);
    } finally { f.dispose(); }
  });

  it('removes controls and ignores queued updates after destruction', async () => {
    const f = fixture();
    f.plugin.destroy();
    await f.refresh('historychanged');
    expect(f.wrapper.querySelector('.kanban-showcase-actions')).toBeNull();
    f.wrapper.remove();
  });
});
