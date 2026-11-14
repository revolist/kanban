import { createCommunityProjection } from './internal/projection.js';
import {
  createCard,
  updateCard,
  deleteCards,
  moveCards,
  type KanbanCommands,
  type CommandCommit,
} from './internal/commands.js';
import { planKanbanMove } from './internal/move.js';
import type { DataType, ColumnProp } from '@revolist/revogrid';
import type {
  KanbanConfig,
  KanbanProjectedCard,
  KanbanCardId,
  KanbanProjection,
  KanbanMoveTarget,
  KanbanMutationResult,
  KanbanCreateOptions,
  KanbanUpdateOptions,
} from './types.js';
import { kanbanIdKey, isKanbanId } from './core/identity.js';
import { resolveKanbanLabels } from './labels.js';
export type KanbanChange<T extends DataType> = {
  action: 'create' | 'update' | 'delete' | 'move';
  previousCards: readonly T[];
  cards: readonly T[];
  cardIds: readonly KanbanCardId[];
  changedCards: readonly T[];
  reason: string;
};
/** Authored records are independent of grid projection and application persistence. */
export class KanbanBoardController<T extends DataType = DataType> {
  private snapshot: readonly T[] = [];
  private get records(): readonly T[] {
    return this.source?.read() ?? this.snapshot;
  }
  private set records(cards: readonly T[]) {
    if (this.source) {
      this.source.write(cards);
    } else {
      this.snapshot = cards;
    }
  }
  private config: KanbanConfig<T>;
  constructor(
    cards: readonly T[],
    config: KanbanConfig<T>,
    private readonly before?: (change: KanbanChange<T>) => boolean,
    private readonly committed?: (change: KanbanChange<T>) => void,
    private readonly source?: { read: () => readonly T[]; write: (cards: readonly T[]) => void },
  ) {
    this.config = config;
    this.configure(config);
    this.records = [...cards];
  }
  configure(config: KanbanConfig<T>): void {
    const labels = resolveKanbanLabels(config.labels);
    for (const key of [
      'history',
      'swimlanes',
      'swimlaneField',
      'swimlaneLayout',
      'swimlaneColumn',
      'contextMenu',
      'remote',
      'persistence',
    ]) {
      if (
        key in config &&
        (config as Record<string, unknown>)[key] !== false &&
        (config as Record<string, unknown>)[key] !== undefined
      ) {
        throw new Error(labels.unsupported(key));
      }
    }
    this.config = config;
  }
  getConfig(): KanbanConfig<T> {
    return this.config;
  }
  getCards(): readonly T[] {
    return this.records;
  }
  replace(cards: readonly T[]): void {
    this.records = [...cards];
  }
  private get idField(): ColumnProp {
    return this.config.fields?.id ?? this.config.idField ?? 'id';
  }
  private get columnField(): ColumnProp {
    return this.config.fields?.status ?? this.config.columnField ?? 'status';
  }
  private get orderField(): ColumnProp {
    return this.config.orderField ?? 'order';
  }
  private get labels() {
    return resolveKanbanLabels(this.config.labels);
  }
  getProjection(): KanbanProjection<T> {
    return createCommunityProjection(this.records, this.config);
  }
  private validate(cards: readonly T[], columnProp: ColumnProp, moving: readonly KanbanCardId[]): string | undefined {
    const column = this.config.columns?.find((c) => c.prop === columnProp);
    if (!column) {
      return this.labels.rejected;
    }
    if (this.config.readOnly) {
      return this.labels.readonly;
    }
    const ids = new Set(moving.map(kanbanIdKey));
    const count =
      this.records.filter(
        (card) =>
          card[this.columnField] === columnProp &&
          (!isKanbanId(card[this.idField]) || !ids.has(kanbanIdKey(card[this.idField] as KanbanCardId))),
      ).length + cards.length;
    if (
      column.allowedFrom?.length &&
      cards.some(
        (card) =>
          card[this.columnField] !== columnProp && !column.allowedFrom!.includes(card[this.columnField] as ColumnProp),
      )
    ) {
      return this.labels.rejected;
    }
    const custom = this.config.rules?.canDrop?.({
      cards,
      sourceColumnProps: cards.map((card) => card[this.columnField] as ColumnProp),
      targetColumn: column,
    });
    if (custom === false) {
      return this.labels.rejected;
    }
    if (typeof custom === 'string') {
      return custom;
    }
    if (column.wipLimit !== undefined && count > column.wipLimit && this.config.wipBehavior === 'block') {
      return this.labels.wip(column.wipLimit);
    }
  }
  getCommands(): KanbanCommands<T, KanbanProjectedCard<T>> {
    const projection = this.getProjection();
    const change = (commit: CommandCommit<T>): KanbanChange<T> => ({
      action: commit.action,
      previousCards: commit.previousCards,
      cards: commit.cards,
      cardIds: commit.cardIds,
      changedCards: commit.changedCards,
      reason: commit.options.reason ?? 'api',
    });
    return {
      active: true,
      idField: this.idField,
      orderField: this.orderField,
      read: () => this.records,
      projection,
      restrict: () => (this.config.readOnly ? this.labels.readonly : undefined),
      canEdit: (id) => {
        const card = projection.cardById.get(id)?.card;
        return !!card && !this.config.readOnly && (this.config.rules?.canEdit?.(card) ?? true);
      },
      placement: (card, options, previous) => {
        const column = options.columnProp ?? card[this.columnField] ?? this.config.columns?.[0]?.prop;
        if (!this.config.columns?.some((item) => item.prop === column)) {
          return undefined;
        }
        return {
          values: new Map([[this.columnField, column]]),
          changed: !previous || previous.card[this.columnField] !== column,
          contains: (item) => item.card[this.columnField] === column,
          validate: (next, original) =>
            this.validate([original?.card ?? next], column as ColumnProp, original ? [original.id] : []),
        };
      },
      message: (key) =>
        key === 'rank' ? this.labels.rankExhausted : key === 'readonly' ? this.labels.readonly : this.labels.invalid,
      before: (commit) => this.before?.(change(commit)) !== false,
      apply: (commit) => {
        this.records = commit.cards;
      },
      committed: (commit) => this.committed?.(change(commit)),
      move: (ids, target) => this.planMove(ids, target),
    };
  }
  createCard(card: T, options: KanbanCreateOptions = {}): KanbanMutationResult<T> {
    return createCard(this.getCommands(), card, options);
  }
  updateCard(id: KanbanCardId, patch: Partial<T>, options: KanbanUpdateOptions = {}): KanbanMutationResult<T> {
    return updateCard(this.getCommands(), id, patch, options);
  }
  deleteCards(ids: readonly KanbanCardId[], options: KanbanUpdateOptions = {}): KanbanMutationResult<T> {
    return deleteCards(this.getCommands(), ids, options);
  }
  moveCards(ids: readonly KanbanCardId[], target: KanbanMoveTarget, reason = 'api'): KanbanMutationResult<T> {
    return moveCards(this.getCommands(), ids, target, { reason });
  }
  private planMove(ids: readonly KanbanCardId[], target: KanbanMoveTarget) {
    const projection = this.getProjection();
    const selected = [...new Set(ids)].map((id) => projection.cardById.get(id));
    const rejected = (reason: string) => ({ ok: false as const, reason, cards: this.records });
    if (!selected.length || selected.some((card) => !card)) {
      return rejected(this.labels.invalid);
    }
    const cards = selected.map((card) => card!.card);
    for (const card of cards) {
      const permission = this.config.rules?.canDrag?.(card);
      if (permission === false || typeof permission === 'string') {
        return rejected(typeof permission === 'string' ? permission : this.labels.rejected);
      }
    }
    const error = this.validate(cards, target.columnProp, ids);
    if (error) {
      return rejected(error);
    }
    return planKanbanMove({
      cards: this.records,
      selected: selected.map((card) => card!),
      targetBucket: projection.cards.filter((card) => card.location.columnProp === target.columnProp),
      target,
      orderField: this.orderField,
      values: new Map([[this.columnField, target.columnProp]]),
      projection,
      projectCards: (records) => createCommunityProjection(records, this.config),
      validation: true,
      immutableMessage: this.labels.readonly,
      projectionMessage: this.labels.invalid,
    });
  }
}
