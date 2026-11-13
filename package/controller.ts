import { commitKanbanTransaction } from './core/transaction.js';
import { insertKanbanRecord, replaceKanbanRecord, removeKanbanRecords } from './core/records.js';
import type { DataType, ColumnProp } from '@revolist/revogrid';
import type {
  KanbanConfig,
  KanbanCardId,
  KanbanProjection,
  KanbanMoveTarget,
  KanbanMutationResult,
  KanbanCreateOptions,
  KanbanUpdateOptions,
} from './types.js';
import { kanbanIdKey, isKanbanId } from './core/identity.js';
import { allocateFractionalRanks, createRebalancedKanbanRanks } from './core/ranks.js';
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
  private records: readonly T[];
  private config: KanbanConfig<T>;
  constructor(
    cards: readonly T[],
    config: KanbanConfig<T>,
    private readonly before?: (change: KanbanChange<T>) => boolean,
    private readonly committed?: (change: KanbanChange<T>) => void,
  ) {
    this.records = [...cards];
    this.config = config;
    this.configure(config);
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
    const seen = new Set<string>();
    const diagnostics: { code: string; message: string; blocking: boolean }[] = [];
    const columns = (this.config.columns ?? []).filter((column) => {
      const key = kanbanIdKey(column.prop);
      if (seen.has(key)) {
        diagnostics.push({ code: 'duplicate-column-prop', message: this.labels.invalid, blocking: true });
        return false;
      }
      seen.add(key);
      return true;
    });
    const counts = new Map<string, number>();
    for (const card of this.records) {
      const id = card[this.idField];
      if (isKanbanId(id)) {
        counts.set(kanbanIdKey(id), (counts.get(kanbanIdKey(id)) ?? 0) + 1);
      }
    }
    const cards = this.records
      .flatMap((card, sourceIndex) => {
        const id = card[this.idField];
        const column = columns.find((c) => c.prop === card[this.columnField]);
        if (!isKanbanId(id) || counts.get(kanbanIdKey(id)) !== 1) {
          diagnostics.push({ code: 'invalid-card-id', message: this.labels.invalid, blocking: true });
          return [];
        }
        if (!column) {
          return [];
        }
        const rank =
          typeof card[this.orderField] === 'number' && Number.isFinite(card[this.orderField])
            ? (card[this.orderField] as number)
            : (sourceIndex + 1) * 1024;
        return [{ id, card, sourceIndex, mutable: true, location: { columnProp: column.prop, index: 0, rank } }];
      })
      .sort((a, b) => a.location.rank - b.location.rank || a.sourceIndex - b.sourceIndex);
    const positions = new Map<string, number>();
    for (const card of cards) {
      const key = kanbanIdKey(card.location.columnProp);
      card.location.index = positions.get(key) ?? 0;
      positions.set(key, card.location.index + 1);
    }
    const filter = this.config.filter;
    const title = this.config.fields?.title ?? this.config.card?.titleField ?? 'title';
    const query = filter?.query?.trim().toLocaleLowerCase(this.config.locale);
    const visible = cards.filter(
      (p) =>
        (filter?.predicate?.(p.card) ?? true) &&
        (!query ||
          (filter?.fields?.length ? filter.fields : [title]).some((field) =>
            String(p.card[field] ?? '')
              .toLocaleLowerCase(this.config.locale)
              .includes(query),
          )) &&
        (columns.find((c) => c.prop === p.location.columnProp)?.cardFilter?.(p.card) ?? true),
    );
    for (const column of columns) {
      const count = this.records.filter((card) => card[this.columnField] === column.prop).length;
      if (column.wipLimit !== undefined && count > column.wipLimit) {
        diagnostics.push({ code: 'column-wip-exceeded', message: this.labels.wip(column.wipLimit), blocking: false });
      }
    }
    return {
      cards,
      columns,
      diagnostics,
      cardById: new Map(cards.map((p) => [p.id, p])),
      visibleCardIds: new Set(visible.map((p) => p.id)),
    };
  }
  private fail(code: string, reason: string): KanbanMutationResult<T> {
    return { ok: false, code, reason };
  }
  private nextRank(column: ColumnProp): number {
    return (
      this.getProjection().cards.reduce(
        (maximum, card) => (card.location.columnProp === column ? Math.max(maximum, card.location.rank) : maximum),
        0,
      ) + 1024
    );
  }
  private canEdit(card: T): boolean {
    return !this.config.readOnly && (this.config.rules?.canEdit?.(card) ?? true);
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
  private commit(
    next: readonly T[],
    action: KanbanChange<T>['action'],
    ids: readonly KanbanCardId[],
    reason: string,
  ): KanbanMutationResult<T> {
    const previous = this.records;
    const previousById = new Map(previous.map((card) => [card[this.idField], card]));
    const changed =
      action === 'delete'
        ? previous.filter((card) => ids.includes(card[this.idField] as KanbanCardId))
        : next.filter((card) => previousById.get(card[this.idField]) !== card);
    const change = { action, previousCards: previous, cards: next, cardIds: ids, changedCards: changed, reason };
    const result = commitKanbanTransaction({
      previous,
      next,
      read: () => this.records,
      before: () => this.before?.(change) !== false,
      apply: (cards) => {
        this.records = cards;
      },
      committed: () => this.committed?.(change),
    });
    if (result !== 'committed') {
      return this.fail(result, this.labels.rejected);
    }
    return { ok: true, cards: changed, cardIds: ids };
  }
  createCard(card: T, options: KanbanCreateOptions = {}): KanbanMutationResult<T> {
    const id = card[this.idField];
    if (!isKanbanId(id) || this.records.some((c) => c[this.idField] === id)) {
      return this.fail('invalid', this.labels.invalid);
    }
    if (!this.canEdit(card)) {
      return this.fail('readonly', this.labels.readonly);
    }
    const column = options.columnProp ?? card[this.columnField] ?? this.config.columns?.[0]?.prop;
    const error = this.validate([card], column as ColumnProp, []);
    if (error) {
      return this.fail('rule', error);
    }
    const rank = this.nextRank(column as ColumnProp);
    const next = insertKanbanRecord(
      this.records,
      {
        ...card,
        [this.columnField]: column,
        [this.orderField]: rank,
      },
      options.sourceIndex ?? this.records.length,
    );
    return this.commit(next, 'create', [id], options.reason ?? 'api');
  }
  updateCard(id: KanbanCardId, patch: Partial<T>, options: KanbanUpdateOptions = {}): KanbanMutationResult<T> {
    const projected = this.getProjection().cardById.get(id);
    const index = projected?.sourceIndex ?? -1;
    if (index < 0) {
      return this.fail('missing', this.labels.invalid);
    }
    const card = this.records[index];
    if (!this.canEdit(card)) {
      return this.fail('readonly', this.labels.readonly);
    }
    if (Object.hasOwn(patch, this.idField) || Object.hasOwn(patch, this.orderField)) {
      return this.fail('invalid', this.labels.invalid);
    }
    const updated = { ...card, ...patch };
    if (Object.keys(patch).every((key) => Object.is(card[key], updated[key]))) {
      return { ok: true, cards: [card], cardIds: [id] };
    }
    if (updated[this.columnField] !== card[this.columnField]) {
      const error = this.validate([card], updated[this.columnField] as ColumnProp, [id]);
      if (error) {
        return this.fail('rule', error);
      }
      updated[this.orderField as keyof T] = this.nextRank(updated[this.columnField] as ColumnProp) as T[keyof T];
    }
    const next = replaceKanbanRecord(this.records, updated, index);
    return this.commit(next, 'update', [id], options.reason ?? 'api');
  }
  deleteCards(ids: readonly KanbanCardId[], options: KanbanUpdateOptions = {}): KanbanMutationResult<T> {
    const unique = [...new Set(ids)];
    const projection = this.getProjection();
    const cards = unique.map((id) => projection.cardById.get(id)?.card);
    if (!unique.length || cards.some((card) => !card)) {
      return this.fail('missing', this.labels.invalid);
    }
    if (cards.some((card) => !this.canEdit(card!))) {
      return this.fail('readonly', this.labels.readonly);
    }
    return this.commit(
      removeKanbanRecords(this.records, new Set(unique), (card) => card[this.idField] as KanbanCardId),
      'delete',
      unique,
      options.reason ?? 'api',
    );
  }
  moveCards(ids: readonly KanbanCardId[], target: KanbanMoveTarget, reason = 'api'): KanbanMutationResult<T> {
    const projection = this.getProjection();
    const selected = [...new Set(ids)].map((id) => projection.cardById.get(id));
    if (!selected.length || selected.some((card) => !card)) {
      return this.fail('missing', this.labels.invalid);
    }
    const cards = selected.map((card) => card!.card);
    for (const card of cards) {
      const permission = this.config.rules?.canDrag?.(card);
      if (permission === false || typeof permission === 'string') {
        return this.fail('rule', typeof permission === 'string' ? permission : this.labels.rejected);
      }
    }
    const error = this.validate(cards, target.columnProp, ids);
    if (error) {
      return this.fail('rule', error);
    }
    const selectedIds = new Set(ids);
    const bucket = projection.cards.filter(
      (card) => card.location.columnProp === target.columnProp && !selectedIds.has(card.id),
    );
    const originalBucket = projection.cards.filter((card) => card.location.columnProp === target.columnProp);
    let insertion =
      target.beforeCardId !== undefined
        ? bucket.findIndex((card) => card.id === target.beforeCardId)
        : target.index === undefined
          ? bucket.length
          : originalBucket.slice(0, target.index).filter((card) => !selectedIds.has(card.id)).length;
    if (target.beforeCardId !== undefined && selectedIds.has(target.beforeCardId)) {
      return { ok: true, cards: [], cardIds: ids };
    }
    if (insertion < 0) {
      return this.fail('invalid', this.labels.rejected);
    }
    insertion = Math.max(0, Math.min(bucket.length, insertion));
    const ordered = [...bucket];
    ordered.splice(insertion, 0, ...selected.map((card) => card!));
    if (originalBucket.length === ordered.length && originalBucket.every((card, i) => card.id === ordered[i].id)) {
      return { ok: true, cards: [], cardIds: ids };
    }
    const ranks = allocateFractionalRanks({
      beforeRank: bucket[insertion - 1]?.location.rank,
      afterRank: bucket[insertion]?.location.rank,
      count: selected.length,
    });
    const updates = new Map<KanbanCardId, T>();
    if (ranks) {
      selected.forEach((card, i) =>
        updates.set(card!.id, { ...card!.card, [this.columnField]: target.columnProp, [this.orderField]: ranks[i] }),
      );
    } else {
      const balanced = createRebalancedKanbanRanks(ordered);
      for (const card of ordered) {
        updates.set(card.id, {
          ...card.card,
          [this.columnField]: target.columnProp,
          [this.orderField]: balanced.get(card.id)!,
        });
      }
    }
    return this.commit(
      this.records.map((card) => updates.get(card[this.idField] as KanbanCardId) ?? card),
      'move',
      ids,
      reason,
    );
  }
}
