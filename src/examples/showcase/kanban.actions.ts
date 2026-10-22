import { BasePlugin, type PluginProviders } from '@revolist/revogrid';
import { KanbanPlugin } from '@revolist/kanban';
import type { HistoryPlugin } from '@revolist/revogrid-pro';

type HistoryActions = Pick<HistoryPlugin, 'canUndo' | 'canRedo' | 'undo' | 'redo'>;

/** Demo-owned controls outside the grid; canonical state stays in the existing plugins. */
export class KanbanShowcaseActionsPlugin extends BasePlugin {
  private readonly panel = document.createElement('section');
  private readonly empty = document.createElement('div');
  private readonly summary = document.createElement('span');
  private readonly buttons: Record<string, HTMLButtonElement> = {};
  private disposed = false;
  private queued = false;

  constructor(grid: HTMLRevoGridElement, providers: PluginProviders) {
    super(grid, providers);
    this.panel.className = 'kanban-showcase-actions';
    this.panel.setAttribute('aria-label', 'Kanban actions');
    const group = document.createElement('div');
    group.className = 'kanban-showcase-actions__buttons';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'Card and history actions');
    for (const [id, label] of Object.entries({ add: 'Add card', edit: 'Edit card', delete: 'Delete card', undo: 'Undo', redo: 'Redo' })) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.dataset.kanbanAction = id;
      button.disabled = true;
      button.onclick = () => this.run(id);
      this.buttons[id] = button;
      group.append(button);
    }
    this.summary.className = 'kanban-showcase-actions__summary';
    this.summary.setAttribute('role', 'status');
    this.panel.append(group, this.summary);
    this.empty.className = 'kanban-showcase-actions__empty';
    this.empty.hidden = true;
    const message = document.createElement('p');
    message.textContent = 'Your board is empty. Add a card to get started.';
    const first = document.createElement('button');
    first.type = 'button';
    first.textContent = 'Create first card';
    first.onclick = () => this.run('add');
    this.empty.append(message, first);
    this.panel.append(this.empty);
    for (const event of ['aftergridinit', 'aftersourceset', 'kanbanselectionchange', 'kanban-card-change', 'historychanged'] as const) {
      this.addEventListener(event, () => this.schedule());
    }
    this.schedule();
  }

  private schedule(): void {
    if (this.queued || this.disposed) return;
    this.queued = true;
    queueMicrotask(() => {
      this.queued = false;
      if (!this.disposed) this.refresh();
    });
  }

  private refresh(): void {
    if (!this.panel.isConnected) this.revogrid.before(this.panel);
    const kanban = this.providers.plugins.getByClass(KanbanPlugin);
    const history = this.history;
    const count = kanban?.getSelectedCardIds().length ?? 0;
    this.buttons.add.disabled = !kanban;
    this.buttons.edit.disabled = count !== 1;
    this.buttons.delete.disabled = count === 0;
    this.buttons.delete.textContent = count > 1 ? 'Delete cards' : 'Delete card';
    this.buttons.undo.disabled = !history?.canUndo();
    this.buttons.redo.disabled = !history?.canRedo();
    this.empty.hidden = !kanban || kanban.getCards().length > 0;
    this.summary.textContent = count ? `${count} selected` : 'Select a card to edit or delete.';
  }

  // Published trials can bundle their Pro dependency: constructor identity is not a public contract.
  private get history(): HistoryActions | undefined {
    return this.providers.plugins.get().find((plugin): plugin is typeof plugin & HistoryActions =>
      'canUndo' in plugin && typeof plugin.canUndo === 'function'
      && 'canRedo' in plugin && typeof plugin.canRedo === 'function'
      && 'undo' in plugin && typeof plugin.undo === 'function'
      && 'redo' in plugin && typeof plugin.redo === 'function');
  }

  private run(action: string): void {
    if (this.disposed) return;
    const kanban = this.providers.plugins.getByClass(KanbanPlugin);
    const history = this.history;
    const selected = kanban?.getSelectedCardIds() ?? [];
    if (action === 'add') kanban?.requestCreateCard();
    if (action === 'edit' && selected.length === 1) kanban?.requestEditCard(selected[0]);
    if (action === 'delete' && selected.length) kanban?.requestDeleteCards(selected);
    if (action === 'undo') history?.undo();
    if (action === 'redo') history?.redo();
    this.schedule();
  }

  override destroy(): void {
    this.disposed = true;
    this.panel.remove();
    super.destroy();
  }
}
