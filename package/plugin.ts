import { createColumnBoardView } from './internal/columns.js';
import { ColumnBoardPointer } from './internal/pointer.js';
import type { CommandOptions } from './internal/commands.js';
import { KanbanSelectionController } from './internal/selection.js';
import { KanbanGridProjection } from './internal/grid.js';
import { createCard, updateCard, deleteCards, moveCards, type KanbanCommands } from './internal/commands.js';
import { type DataType, type PluginProviders, type ColumnRegular, type ColumnProp } from '@revolist/revogrid';
import {
  CorePlugin,
  bindObservableProp,
  DATA_GRID_ROW_SOURCE_OWNER,
  DATA_GRID_CONTEXT_MENU_EXTERNAL_ROW_OWNER,
  findDataGridRowSourceOwner,
} from '@revolist/grid-runtime';
import { KanbanBoardController, type KanbanChange } from './controller.js';
import { kanbanIdKey, createKanbanCardId, updateKanbanSelection } from './core/index.js';
import { resolveKanbanLabels } from './labels.js';
import type {
  KanbanConfig,
  KanbanCardId,
  KanbanProjection,
  KanbanCreateOptions,
  KanbanUpdateOptions,
  KanbanMoveOptions,
  KanbanMoveTarget,
  KanbanMutationResult,
} from './types.js';
import { KanbanCardEditorDialogPlugin } from './editor.js';
export interface KanbanConfigRegistry {
  community: KanbanConfig<any>;
}
export type KanbanHostConfig = KanbanConfigRegistry[keyof KanbanConfigRegistry];
declare global {
  interface HTMLRevoGridElement {
    kanban?: KanbanHostConfig | false;
  }
}
declare module '@revolist/revogrid' {
  namespace JSX {
    interface RevoGrid {
      kanban?: KanbanHostConfig | false;
    }
  }
  interface AdditionalData {
    kanban?: KanbanHostConfig | false;
  }
}
export interface KanbanContributions {
  /** Installed before configuration; products supply projection policy and services. */
  readonly configure: (config: unknown) => void;
}
/** Grid projection for a local column board. Canonical records have one owner shared by edition contributions. */
export class KanbanPlugin<
  T extends DataType = DataType,
  Config = KanbanConfig<T>,
  Projection = KanbanProjection<T>,
> extends CorePlugin {
  protected canonicalRecords: T[] = [];
  private communityContributions?: KanbanContributions;
  private communityStarted = false;
  private communityDisposed = false;
  private communityPending: KanbanConfig<T> | false | undefined;
  protected installKanbanContributions(contributions: KanbanContributions): void {
    if (this.communityStarted) {
      throw new Error('Contributions must be installed before configuration.');
    }
    this.communityContributions = contributions;
    this.startKanban();
  }
  private startKanban(): void {
    if (this.communityStarted || this.communityDisposed) {
      return;
    }
    this.communityStarted = true;
    this.communityConfigure(this.communityPending);
  }
  protected getCommandHost(): KanbanCommands<T, any> {
    if (this.communityController) {
      return this.communityController.getCommands();
    }
    return { active: false, message: () => 'Kanban is not active.' } as unknown as KanbanCommands<T, any>;
  }
  private communityController?: KanbanBoardController<T>;
  private communityApplying = false;
  private communityView?: { rows: DataType[]; columns: ColumnRegular[] };
  private communityGrid: KanbanGridProjection<T>;
  private communitySelection = new KanbanSelectionController();
  private get communitySelected(): KanbanCardId[] {
    return [...this.communitySelection.get()];
  }
  private set communitySelected(ids: KanbanCardId[]) {
    this.communitySelection.set(ids);
  }
  private communityAnchor?: KanbanCardId;
  private communityEditor?: KanbanCardEditorDialogPlugin<T>;
  private communityOwnsEditor = false;
  private communityPointerController: ColumnBoardPointer;
  private communityLive?: HTMLElement;
  get [DATA_GRID_ROW_SOURCE_OWNER](): string | undefined {
    return this.communityController ? 'KanbanPlugin' : undefined;
  }
  get [DATA_GRID_CONTEXT_MENU_EXTERNAL_ROW_OWNER](): true | undefined {
    return this.communityController ? true : undefined;
  }
  constructor(grid: HTMLRevoGridElement, providers: PluginProviders) {
    super(grid, providers);
    this.canonicalRecords = [...((grid.source ?? []) as T[])];
    this.communityPointerController = new ColumnBoardPointer(
      grid,
      () => this.communitySelected,
      (ids, target) => {
        this.moveCards(ids, target, { reason: 'pointer' });
      },
    );
    this.communityGrid = new KanbanGridProjection(grid, providers, {
      className: 'kanban-community',
      project: () => ({
        rows: this.communityView?.rows ?? [],
        columns: this.communityView?.columns ?? [],
        rowHeaders: false,
        rowSize: this.communityController?.getConfig().cardRowHeight ?? 176,
        rowDefinitions: [],
      }),
    });
    this.addEventListener('beforesourceset', (event) => {
      if (!this.communityController || this.communityApplying || !Array.isArray(event.detail.source)) {
        return;
      }
      this.communityController.replace(event.detail.source as T[]);
      this.communityProject();
      event.detail.source = this.communityView?.rows ?? [];
    });
    this.addEventListener('beforecolumnsgather', (event) => {
      if (this.communityController && !this.communityApplying) {
        this.communityGrid.captureColumns(event.detail.columns);
        event.detail.columns = this.communityView?.columns ?? [];
      }
    });
    const initial = bindObservableProp<KanbanConfig<T> | false | undefined>(this, {
      prop: 'kanban',
      additionalDataKey: 'kanban',
      apply: (value) => {
        this.communityPending = value;
        if (this.communityStarted) {
          this.communityConfigure(value);
        }
      },
    });
    this.communityPending = initial;
    queueMicrotask(() => this.startKanban());
  }
  private communityConfigure(config: KanbanConfig<T> | false | undefined): void {
    if (this.communityContributions) {
      this.communityContributions.configure(config);
      return;
    }
    if (!config) {
      this.communityDeactivate();
      this.emit('kanbanconfigchange', { config: null });
      return;
    }
    if (findDataGridRowSourceOwner(this.providers.plugins.get(), this)) {
      return;
    }
    if (!this.communityController) {
      this.canonicalRecords = [...((this.revogrid.source ?? []) as T[])];
    }
    if (this.communityController) {
      this.communityController.configure(config);
    } else {
      this.communityController = new KanbanBoardController(
        this.canonicalRecords,
        config,
        (change) => this.communityBefore(change),
        (change) => this.communityCommitted(change),
        {
          read: () => this.canonicalRecords,
          write: (cards) => {
            this.canonicalRecords = cards as T[];
          },
        },
      );
    }
    this.communityGrid.initialize();
    this.communitySelected = [...(config.selection?.selectedIds ?? [])];
    this.revogrid.classList.add('kanban-community', 'rv-native-controls');
    this.revogrid.range = false;
    this.revogrid.canFocus = false;
    this.revogrid.rowHeaders = false;
    if (!this.communityLive) {
      this.communityLive = this.revogrid.ownerDocument.createElement('div');
      this.communityLive.className = 'kanban-community-live';
      this.communityLive.setAttribute('aria-live', 'polite');
      this.revogrid.append(this.communityLive);
    }
    this.communityProject();
    if (!this.communityEditor) {
      this.communityEditor = this.providers.plugins.getByClass(KanbanCardEditorDialogPlugin) as
        | KanbanCardEditorDialogPlugin<T>
        | undefined;
      if (!this.communityEditor) {
        this.communityEditor = new KanbanCardEditorDialogPlugin(
          this.revogrid,
          this.providers,
          this as unknown as KanbanPlugin<T>,
        );
        this.providers.plugins.add(this.communityEditor);
        this.communityOwnsEditor = true;
      }
    }
    this.emit('kanbanconfigchange', { config: this.getConfig() });
  }
  getCards(): readonly T[] {
    return this.canonicalRecords;
  }
  getConfig(): Config | null {
    return (this.communityController?.getConfig() ?? null) as Config | null;
  }
  getProjection(): Projection | null {
    return (this.communityController?.getProjection() ?? null) as Projection | null;
  }
  getSelectedCardIds(): readonly KanbanCardId[] {
    return [...this.communitySelected];
  }
  setSelectedCardIds(ids: readonly KanbanCardId[]): void {
    const projection = this.communityController?.getProjection();
    const config = this.communityController?.getConfig();
    this.communitySelected = [...new Set(ids)].filter((id) => {
      const card = projection?.cardById.get(id)?.card;
      return card && projection?.visibleCardIds.has(id) && config?.rules?.canSelect?.(card) !== false;
    });
    if (config?.selection?.mode === 'single') {
      this.communitySelected = this.communitySelected.slice(0, 1);
    }
    this.communityProject();
    this.emit('kanbanselectionchange', {
      cardIds: this.getSelectedCardIds(),
      cards: this.getCards().filter((card) => this.communitySelected.includes(this.communityId(card))),
      mode: 'api',
    });
  }
  private communityId(card: T): KanbanCardId {
    const c = this.communityController?.getConfig();
    return card[c?.fields?.id ?? c?.idField ?? 'id'] as KanbanCardId;
  }
  createCard(card: T, options: KanbanCreateOptions = {}): KanbanMutationResult<T> {
    return createCard(this.getCommandHost(), card, options);
  }
  updateCard(id: KanbanCardId, patch: Partial<T>, options: KanbanUpdateOptions = {}): KanbanMutationResult<T> {
    return updateCard(this.getCommandHost(), id, patch, options);
  }
  deleteCards(ids: readonly KanbanCardId[], options: KanbanUpdateOptions = {}): KanbanMutationResult<T> {
    return deleteCards(this.getCommandHost(), ids, options);
  }
  moveCards<Options extends KanbanMoveOptions = KanbanMoveOptions>(
    ids: readonly KanbanCardId[],
    target: KanbanMoveTarget,
    options: Options = {} as Options,
  ): boolean {
    return moveCards(this.getCommandHost(), ids, target, options as unknown as CommandOptions).ok;
  }
  setFilter(filter?: import('./types.js').KanbanFilterConfig<T>): void {
    if (this.communityController) {
      this.communityController.configure({ ...this.communityController.getConfig(), filter });
      this.refresh();
    }
  }
  canCreateCard(): boolean {
    return !!this.communityController && !this.communityController.getConfig().readOnly;
  }
  canEditCard(id: KanbanCardId): boolean {
    const card = this.communityController?.getProjection().cardById.get(id)?.card;
    return !!card && this.canCreateCard() && (this.communityController?.getConfig().rules?.canEdit?.(card) ?? true);
  }
  canDeleteCards(ids: readonly KanbanCardId[]): boolean {
    return ids.length > 0 && ids.every((id) => this.canEditCard(id));
  }
  requestCreateCard(detail: { card?: T; columnProp?: ColumnProp } = {}): void {
    this.emit('kanbancardcreaterequest', detail);
  }
  requestEditCard(id: KanbanCardId): void {
    this.emit('kanbancardeditrequest', {
      cardId: id,
      card: this.communityController?.getProjection().cardById.get(id)?.card,
    });
  }
  requestDeleteCards(ids: readonly KanbanCardId[]): void {
    this.emit('kanbancarddeleterequest', {
      cardIds: ids,
      cards: this.getCards().filter((card) => ids.includes(this.communityId(card))),
    });
  }
  getColumnOrder(): readonly ColumnProp[] {
    return this.communityController?.getConfig().columns?.map((column) => column.prop) ?? [];
  }
  setColumnOrder(order: readonly ColumnProp[]): void {
    const config = this.communityController?.getConfig();
    if (!config) {
      return;
    }
    const columns = [...(config.columns ?? [])];
    const positions = new Map(order.map((prop, index) => [prop, index]));
    columns.sort((left, right) => (positions.get(left.prop) ?? Infinity) - (positions.get(right.prop) ?? Infinity));
    this.communityController!.configure({ ...config, columns });
    this.refresh();
    this.emit('kanbancolumnorderchange', { columnProps: columns.map((column) => column.prop), reason: 'api' });
  }
  getCollapsedColumnProps(): readonly ColumnProp[] {
    return (
      this.communityController
        ?.getConfig()
        .columns?.filter((column) => column.collapsed)
        .map((column) => column.prop) ?? []
    );
  }
  setColumnCollapsed(prop: ColumnProp, collapsed: boolean): void {
    const config = this.communityController?.getConfig();
    if (!config) {
      return;
    }
    this.communityController!.configure({
      ...config,
      columns: config.columns?.map((column) => (column.prop === prop ? { ...column, collapsed } : column)),
    });
    this.refresh();
  }
  refresh(): void {
    this.communityProject();
  }
  async revealCard(id: KanbanCardId): Promise<boolean> {
    const index = this.communityController?.getProjection().cardById.get(id)?.location.index;
    if (index === undefined) {
      return false;
    }
    await this.revogrid.scrollToRow(index);
    return true;
  }
  private communityBefore(change: KanbanChange<T>): boolean {
    const action = change.action;
    const cards =
      action === 'delete'
        ? change.previousCards.filter((card) => change.cardIds.includes(this.communityId(card)))
        : change.changedCards;
    const detail = {
      ...change,
      card: cards[0],
      cardId: change.cardIds[0],
      previousCard: change.previousCards.find((card) => this.communityId(card) === change.cardIds[0]),
      sourceIndex: change.cards.findIndex((card) => this.communityId(card) === change.cardIds[0]),
    };
    return !this.emit(`beforekanbancard${action}`, detail).defaultPrevented;
  }
  private communityCommitted(change: KanbanChange<T>): void {
    this.communityProject();
    const cards =
      change.action === 'delete'
        ? change.previousCards.filter((card) => change.cardIds.includes(this.communityId(card)))
        : change.changedCards;
    this.emit(`kanbancard${change.action}`, { ...change, cards, card: cards[0], cardId: change.cardIds[0] });
    this.emit('kanban-card-change', change);
    const labels = resolveKanbanLabels(this.communityController?.getConfig().labels);
    this.communityAnnounce((change.action === 'move' ? labels.moved : labels.changed)(change.cardIds.length));
  }
  private communityAnnounce(message: string): void {
    if (this.communityLive) {
      this.communityLive.textContent = message;
    }
  }
  private communityProject(): void {
    if (!this.communityController || this.communityApplying) {
      return;
    }
    this.communityApplying = true;
    try {
      const projection = this.communityController.getProjection();
      const selected = this.communitySelected;
      const config = this.communityController.getConfig();
      this.communitySelection.prune(
        new Set(
          selected.filter((id) => {
            const card = projection.cardById.get(id);
            return !!card && projection.visibleCardIds.has(id) && config.rules?.canSelect?.(card.card) !== false;
          }),
        ),
      );
      if (selected.length !== this.communitySelection.get().length) {
        this.emit('kanbanselectionchange', {
          cardIds: this.communitySelected,
          cards: projection.cards.filter((card) => this.communitySelection.has(card.id)).map((card) => card.card),
          mode: 'api',
        });
      }
      this.communityView = createColumnBoardView(this.communityController.getConfig(), projection, {
        selected: () => this.communitySelection.get(),
        canCreate: () => this.canCreateCard(),
        create: (target) => this.requestCreateCard(target),
        edit: (id) => this.requestEditCard(id),
        collapse: (prop, collapsed) => this.setColumnCollapsed(prop, collapsed),
        select: (id, event) => this.communitySelect(id, event, projection),
        pointer: (event, id) => this.communityPointer(event, id),
        key: (event, id, column) => this.communityKey(event, id, column),
      });
      this.communityGrid.applyProjection(undefined);
      this.emit('kanbandiagnostics', { diagnostics: projection.diagnostics });
      const warning = projection.diagnostics.find((item) => item.code === 'column-wip-exceeded');
      if (warning) {
        this.communityAnnounce(warning.message);
      }
    } finally {
      this.communityApplying = false;
    }
  }
  private communitySelect(id: KanbanCardId, event: MouseEvent, projection: KanbanProjection<T>): void {
    const config = this.communityController?.getConfig();
    this.communitySelected = [
      ...updateKanbanSelection({
        currentIds: this.communitySelected,
        cardId: id,
        mode: event.shiftKey ? 'range' : event.metaKey || event.ctrlKey ? 'toggle' : 'replace',
        orderedCardIds: [...projection.visibleCardIds],
        anchorId: this.communityAnchor,
        selectionMode: config?.selection?.mode,
      }),
    ];
    this.communityAnchor = id;
    this.setSelectedCardIds(this.communitySelected);
  }
  private communityKey(event: KeyboardEvent, id: KanbanCardId, columnProp: ColumnProp): void {
    if ((event.target as HTMLElement).closest('input,button,select,textarea,a,[contenteditable]')) {
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (this.canEditCard(id)) {
        this.requestEditCard(id);
      }
      return;
    }
    if (event.key === ' ') {
      event.preventDefault();
      this.setSelectedCardIds(
        this.communitySelected.includes(id)
          ? this.communitySelected.filter((value) => value !== id)
          : [...this.communitySelected, id],
      );
      return;
    }
    if (!event.key.startsWith('Arrow')) {
      return;
    }
    event.preventDefault();
    const p = this.communityController!.getProjection();
    const card = p.cardById.get(id)!;
    const columnIndex = p.columns.findIndex((column) => column.prop === columnProp);
    const column = p.columns[columnIndex + (event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0)];
    if (!column) {
      return;
    }
    const target = {
      columnProp: column.prop,
      index: Math.max(0, card.location.index + (event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 2 : 0)),
    };
    const ids = this.communitySelected.includes(id) ? this.communitySelected : [id];
    this.moveCards(ids, target, { reason: 'keyboard' });
    queueMicrotask(() =>
      this.revogrid
        .querySelector<HTMLElement>(
          `[data-kanban-community-card="${CSS.escape(String(id))}"][data-kanban-card-id-type="${typeof id}"]`,
        )
        ?.focus(),
    );
  }
  private communityPointer(event: PointerEvent, id: KanbanCardId): void {
    if (this.canCreateCard()) {
      this.communityPointerController.start(event, id);
    }
  }
  private communityDeactivate(): void {
    if (!this.communityController) {
      return;
    }
    const cards = [...this.getCards()];
    this.communityPointerController.cancel();
    this.communityEditor?.close();
    if (this.communityEditor && this.communityOwnsEditor) {
      this.providers.plugins.remove(this.communityEditor);
    }
    this.communityEditor = undefined;
    this.communityOwnsEditor = false;
    this.communityLive?.remove();
    this.communityLive = undefined;
    this.communityController = undefined;
    this.communitySelection.clear();
    this.communityAnchor = undefined;
    this.communityView = undefined;
    this.communityApplying = true;
    try {
      this.communityGrid.restore(cards);
      this.revogrid.classList.remove('kanban-community', 'rv-native-controls');
    } finally {
      this.communityApplying = false;
    }
  }
  override destroy(): void {
    this.communityDisposed = true;
    this.communityDeactivate();
    super.destroy();
  }
}
