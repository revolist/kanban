import type { CommandOptions } from './internal/commands.js';
import { KanbanSelectionController } from './internal/selection.js';
import { renderKanbanCardFrame, renderKanbanCardContent } from './internal/card.js';
import { KanbanGridProjection } from './internal/grid.js';
import { createCard, updateCard, deleteCards, moveCards, type KanbanCommands } from './internal/commands.js';
import {
  h as gridH,
  type VNode,
  getColumns,
  type DataType,
  type PluginProviders,
  type ColumnRegular,
  type ColumnProp,
} from '@revolist/revogrid';
import {
  CorePlugin,
  bindObservableProp,
  DATA_GRID_ROW_SOURCE_OWNER,
  DATA_GRID_CONTEXT_MENU_EXTERNAL_ROW_OWNER,
  findDataGridRowSourceOwner,
} from '@revolist/grid-runtime';
import { renderControl } from '@revolist/ui/native';
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
const h = gridH as unknown as (tag: string, props?: Record<string, unknown>, children?: unknown) => VNode;
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
  private communityDrag?: {
    pointer: number;
    id: KanbanCardId;
    x: number;
    y: number;
    active: boolean;
    source: HTMLElement;
  };
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
    this.communityGrid = new KanbanGridProjection(grid, providers, {
      className: 'kanban-community',
      project: () => ({
        rows: this.communityRows(),
        columns: this.communityColumns(),
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
      event.detail.source = this.communityRows();
    });
    this.addEventListener('beforecolumnsgather', (event) => {
      if (this.communityController && !this.communityApplying) {
        event.detail.columns = this.communityColumns();
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
    this.communityGrid.initialize();
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
    const existing = new Set(this.getCards().map((card) => this.communityId(card)));
    this.communitySelected = this.communitySelected.filter((id) => existing.has(id));
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
  private communityRows(): DataType[] {
    const p = this.communityController?.getProjection();
    if (!p) {
      return [];
    }
    const heights = p.columns.map(
      (column) =>
        p.cards.filter((card) => card.location.columnProp === column.prop && p.visibleCardIds.has(card.id)).length,
    );
    return Array.from({ length: Math.max(0, ...heights) + 1 }, (_, index) => ({ __kanbanCommunityIndex: index }));
  }
  private communityColumns(): ColumnRegular[] {
    const c = this.communityController?.getConfig();
    const p = this.communityController?.getProjection();
    if (!c || !p) {
      return [];
    }
    return p.columns.map((column) => {
      const items = p.cards.filter((card) => card.location.columnProp === column.prop && p.visibleCardIds.has(card.id));
      return {
        prop: column.prop,
        name: column.name ?? String(column.prop),
        readonly: true,
        sortable: false,
        size: column.collapsed ? 56 : (column.size ?? 288),
        minSize: column.minSize ?? 56,
        maxSize: column.maxSize,
        columnTemplate: () =>
          h('span', { class: 'kanban-community-column-title' }, [
            column.collapsed
              ? null
              : h(
                  'span',
                  { class: 'kanban-community-column-caption' },
                  `${column.name ?? column.prop} (${items.length})`,
                ),
            column.collapsible !== false
              ? renderControl(
                  h,
                  'button',
                  {
                    type: 'button',
                    'aria-label': resolveKanbanLabels(c.labels)[column.collapsed ? 'expandColumn' : 'collapseColumn'],
                    'aria-expanded': String(!column.collapsed),
                    onClick: () => this.setColumnCollapsed(column.prop, !column.collapsed),
                  },
                  column.collapsed ? '+' : '−',
                )
              : null,
          ]),
        cellTemplate: (_h, { model }) => {
          const index = Number(model.__kanbanCommunityIndex);
          const projected = items[index];
          const attributes = {
            'data-kanban-community-column': String(column.prop),
            'data-kanban-community-column-type': typeof column.prop,
            'data-kanban-community-index': String(index),
          };
          if (column.collapsed) {
            return h('div', { class: 'kanban-community-collapsed' });
          }
          if (!projected) {
            return h(
              'div',
              { ...attributes, class: 'kanban-community-stack' },
              index === items.length && this.canCreateCard()
                ? renderControl(
                    h,
                    'button',
                    {
                      type: 'button',
                      'aria-label': resolveKanbanLabels(c.labels).add,
                      onClick: () => this.requestCreateCard({ columnProp: column.prop }),
                    },
                    '+',
                  )
                : null,
            );
          }
          const title =
            c.card?.title?.(projected.card) ??
            String(projected.card[c.fields?.title ?? c.card?.titleField ?? 'title'] ?? projected.id);
          const selected = this.communitySelected.includes(projected.id);
          return h(
            'div',
            { ...attributes, class: 'kanban-community-stack' },
            renderKanbanCardFrame(h, {
              id: projected.id,
              index,
              label: title,
              selected,
              mutable: projected.mutable,
              readonly: !this.canEditCard(projected.id),
              selectable: c.rules?.canSelect?.(projected.card) !== false,
              draggable: !c.readOnly && c.rules?.canDrag?.(projected.card) !== false,
              attributes: {
                class: `kanban-community-card${selected ? ' is-selected' : ''}`,
                style: { touchAction: 'none' },
              },
              select: (event: MouseEvent) => {
                if (c.rules?.canSelect?.(projected.card) === false) {
                  return;
                }
                this.communitySelected = [
                  ...updateKanbanSelection({
                    currentIds: this.communitySelected,
                    cardId: projected.id,
                    mode: event.shiftKey ? 'range' : event.metaKey || event.ctrlKey ? 'toggle' : 'replace',
                    orderedCardIds: [...p.visibleCardIds],
                    anchorId: this.communityAnchor,
                    selectionMode: c.selection?.mode,
                  }),
                ];
                this.communityAnchor = projected.id;
                this.setSelectedCardIds(this.communitySelected);
              },
              pointerDown: (event) => this.communityPointer(event, projected.id),
              keyDown: (event) => this.communityKey(event, projected.id, column.prop),
              edit: () => this.requestEditCard(projected.id),
              content: renderKanbanCardContent(h, {
                title,
                description:
                  c.card?.description?.(projected.card) ?? projected.card[c.card?.descriptionField ?? 'description'],
                custom: c.customization?.cardContent?.(h, { card: projected.card, column, selected }),
              }),
            }),
          );
        },
      };
    });
  }
  private communityProject(): void {
    if (!this.communityController || this.communityApplying) {
      return;
    }
    this.communityApplying = true;
    try {
      this.communityGrid.applyProjection(undefined);
      this.emit('kanbandiagnostics', { diagnostics: this.communityController.getProjection().diagnostics });
      const warning = this.communityController
        .getProjection()
        .diagnostics.find((item) => item.code === 'column-wip-exceeded');
      if (warning) {
        this.communityAnnounce(warning.message);
      }
    } finally {
      this.communityApplying = false;
    }
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
      this.revogrid.querySelector<HTMLElement>(`[data-kanban-community-card="${CSS.escape(String(id))}"]`)?.focus(),
    );
  }
  private communityPointer(event: PointerEvent, id: KanbanCardId): void {
    if (
      event.button !== 0 ||
      !this.canCreateCard() ||
      (event.target as HTMLElement).closest('input,button,select,textarea,a')
    ) {
      return;
    }
    this.communityCancelPointer?.();
    const source = event.currentTarget as HTMLElement;
    this.communityDrag = { pointer: event.pointerId, id, x: event.clientX, y: event.clientY, active: false, source };
    const document = this.revogrid.ownerDocument;
    const move = (next: PointerEvent) => {
      const drag = this.communityDrag;
      if (!drag || drag.pointer !== next.pointerId) {
        return;
      }
      if (Math.hypot(next.clientX - drag.x, next.clientY - drag.y) > 8) {
        drag.active = true;
        next.preventDefault();
        source.classList.add('is-moving');
      }
    };
    const end = (next: PointerEvent) => {
      const drag = this.communityDrag;
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', end);
      document.removeEventListener('pointercancel', cancel);
      this.communityDrag = undefined;
      source.classList.remove('is-moving');
      if (!drag?.active) {
        return;
      }
      const stack = document
        .elementFromPoint(next.clientX, next.clientY)
        ?.closest<HTMLElement>('[data-kanban-community-column]');
      if (stack && this.revogrid.contains(stack)) {
        const value = stack.dataset.kanbanCommunityColumn!;
        const prop = stack.dataset.kanbanCommunityColumnType === 'number' ? Number(value) : value;
        this.moveCards(
          this.communitySelected.includes(id) ? this.communitySelected : [id],
          { columnProp: prop, index: Number(stack.dataset.kanbanCommunityIndex) },
          { reason: 'pointer' },
        );
      }
    };
    const cancel = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', end);
      document.removeEventListener('pointercancel', cancel);
      this.communityDrag = undefined;
      source.classList.remove('is-moving');
    };
    document.addEventListener('pointermove', move, { passive: false });
    document.addEventListener('pointerup', end);
    document.addEventListener('pointercancel', cancel);
    this.communityCancelPointer = cancel;
  }
  private communityCancelPointer?: () => void;
  private communityDeactivate(): void {
    if (!this.communityController) {
      return;
    }
    const cards = [...this.getCards()];
    this.communityCancelPointer?.();
    this.communityEditor?.close();
    if (this.communityEditor && this.communityOwnsEditor) {
      this.providers.plugins.remove(this.communityEditor);
    }
    this.communityEditor = undefined;
    this.communityOwnsEditor = false;
    this.communityLive?.remove();
    this.communityLive = undefined;
    this.communityController = undefined;
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
