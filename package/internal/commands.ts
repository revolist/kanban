import type { ColumnProp, DataType } from '@revolist/revogrid';
import type { KanbanCardId, KanbanMutationResult } from '../types.js';
import { isKanbanId, kanbanIdKey, writeKanbanFields } from '../core/identity.js';
import { insertKanbanRecord, replaceKanbanRecord, removeKanbanRecords } from '../core/records.js';
import { allocateFractionalRanks } from '../core/ranks.js';
import { commitKanbanTransaction } from '../core/transaction.js';

export interface CommandCard<T extends DataType> {
  readonly id: KanbanCardId;
  readonly card: T;
  readonly sourceIndex: number;
  readonly location: { readonly rank: number };
}
export interface CommandPlacement<T extends DataType, P extends CommandCard<T>> {
  readonly values: ReadonlyMap<ColumnProp, unknown>;
  readonly changed: boolean;
  readonly contains: (card: P) => boolean;
  readonly validate: (card: T, previous?: P) => string | undefined;
}
export interface CommandOptions {
  readonly reason?: string;
  readonly sourceIndex?: number;
  readonly [key: string]: unknown;
}
export interface CommandCommit<T extends DataType> {
  readonly action: 'create' | 'update' | 'delete' | 'move';
  readonly previousCards: readonly T[];
  readonly cards: readonly T[];
  readonly changedCards: readonly T[];
  readonly cardIds: readonly KanbanCardId[];
  readonly changedSourceIndexes: readonly number[];
  readonly detail: Record<string, any>;
  readonly options: CommandOptions;
  readonly plan?: any;
}
export interface KanbanCommands<T extends DataType, P extends CommandCard<T> = CommandCard<T>> {
  readonly active: boolean;
  readonly idField: ColumnProp;
  readonly orderField: ColumnProp;
  readonly read: () => readonly T[];
  readonly projection: { readonly cards: readonly P[]; readonly cardById: ReadonlyMap<KanbanCardId, P> };
  readonly restrict: (action: CommandCommit<T>['action'], ids: readonly KanbanCardId[]) => string | undefined;
  readonly canEdit: (id: KanbanCardId) => boolean;
  readonly placement: (card: T, options: CommandOptions, previous?: P) => CommandPlacement<T, P> | undefined;
  readonly before: (commit: CommandCommit<T>) => boolean;
  readonly apply: (commit: CommandCommit<T>) => void;
  readonly committed: (commit: CommandCommit<T>) => void;
  readonly message: (
    key:
      | 'inactive'
      | 'invalid'
      | 'duplicate'
      | 'missing'
      | 'readonly'
      | 'protected'
      | 'target'
      | 'cancelled'
      | 'stale'
      | 'rank',
    id?: KanbanCardId,
  ) => string;
  readonly move: (ids: readonly KanbanCardId[], target: any) => any;
  readonly moveRejected?: (ids: readonly KanbanCardId[], target: any, reason: string) => void;
  readonly moveUnchanged?: () => void;
}
const fail = <T extends DataType>(code: string, reason: string): KanbanMutationResult<T> => ({
  ok: false,
  code,
  reason,
});
function commit<T extends DataType>(host: KanbanCommands<T, any>, change: CommandCommit<T>): KanbanMutationResult<T> {
  const result = commitKanbanTransaction({
    previous: change.previousCards,
    next: change.cards,
    read: host.read,
    before: () => host.before(change),
    apply: () => host.apply(change),
    committed: () => host.committed(change),
  });
  if (result !== 'committed') {
    return fail(result === 'stale' ? 'stale' : 'cancelled', host.message(result));
  }
  return { ok: true, cards: change.changedCards, cardIds: change.cardIds };
}
export function createCard<T extends DataType>(
  host: KanbanCommands<T, any>,
  card: T,
  options: CommandOptions = {},
): KanbanMutationResult<T> {
  if (!host.active) {
    return fail('inactive', host.message('inactive'));
  }
  const previousCards = host.read();
  const restriction = host.restrict('create', []);
  if (restriction) {
    return fail('readonly', restriction);
  }
  const id = card[host.idField];
  if (!isKanbanId(id)) {
    return fail('invalid', host.message('invalid'));
  }
  if (previousCards.some((item) => item[host.idField] === id)) {
    return fail('duplicate', host.message('duplicate', id));
  }
  const placement = host.placement(card, options);
  if (!placement) {
    return fail('invalid', host.message('target'));
  }
  const rank = appendRank(host.projection.cards.filter(placement.contains));
  if (rank === undefined) {
    return fail('rank-exhausted', host.message('rank'));
  }
  const values = new Map(placement.values);
  values.set(host.orderField, rank);
  const nextCard = writeKanbanFields(card, values);
  const error = placement.validate(nextCard);
  if (error) {
    return fail('rule', error);
  }
  const sourceIndex = Math.max(0, Math.min(previousCards.length, options.sourceIndex ?? previousCards.length));
  const detail = { card: nextCard, cardId: id, sourceIndex, reason: options.reason ?? 'api' };
  return commit(host, {
    action: 'create',
    previousCards,
    cards: insertKanbanRecord(previousCards, nextCard, sourceIndex),
    changedCards: [nextCard],
    cardIds: [id],
    changedSourceIndexes: [sourceIndex],
    detail,
    options,
  });
}
export function updateCard<T extends DataType>(
  host: KanbanCommands<T, any>,
  id: KanbanCardId,
  patch: Partial<T>,
  options: CommandOptions = {},
): KanbanMutationResult<T> {
  if (!host.active) {
    return fail('inactive', host.message('inactive'));
  }
  const previousCards = host.read();
  const projected = host.projection.cardById.get(id);
  if (!projected) {
    return fail('missing', host.message('missing', id));
  }
  if (!host.canEdit(id)) {
    return fail('readonly', host.message('readonly'));
  }
  if ([host.idField, host.orderField].some((field) => Object.hasOwn(patch, field))) {
    return fail('invalid', host.message('protected'));
  }
  let nextCard = { ...projected.card, ...patch };
  const placement = host.placement(nextCard, options, projected);
  if (!placement) {
    return fail('invalid', host.message('target'));
  }
  nextCard = writeKanbanFields(nextCard, placement.values);
  if (placement.changed) {
    const error = placement.validate(nextCard, projected);
    if (error) {
      return fail('rule', error);
    }
    const rank = appendRank(host.projection.cards.filter((item) => item.id !== id && placement.contains(item)));
    if (rank === undefined) {
      return fail('rank-exhausted', host.message('rank'));
    }
    nextCard = writeKanbanFields(nextCard, new Map([[host.orderField, rank]]));
  }
  if (
    Object.keys(nextCard).length === Object.keys(projected.card).length &&
    Object.keys(nextCard).every((key) => Object.is(nextCard[key], projected.card[key]))
  ) {
    return { ok: true, cards: [projected.card], cardIds: [id] };
  }
  const detail = {
    card: nextCard,
    previousCard: projected.card,
    cardId: id,
    sourceIndex: projected.sourceIndex,
    reason: options.reason ?? 'api',
  };
  return commit(host, {
    action: 'update',
    previousCards,
    cards: replaceKanbanRecord(previousCards, nextCard, projected.sourceIndex),
    changedCards: [nextCard],
    cardIds: [id],
    changedSourceIndexes: [projected.sourceIndex],
    detail,
    options,
  });
}
export function deleteCards<T extends DataType>(
  host: KanbanCommands<T, any>,
  ids: readonly KanbanCardId[],
  options: CommandOptions = {},
): KanbanMutationResult<T> {
  if (!host.active) {
    return fail('inactive', host.message('inactive'));
  }
  const previousCards = host.read();
  const restriction = host.restrict('delete', ids);
  if (restriction) {
    return fail('readonly', restriction);
  }
  const unique = [...new Map(ids.map((id) => [kanbanIdKey(id), id])).values()];
  const selected = unique.map((id) => host.projection.cardById.get(id));
  if (!unique.length || selected.some((card) => !card)) {
    return fail('missing', host.message('missing'));
  }
  if (unique.some((id) => !host.canEdit(id))) {
    return fail('readonly', host.message('readonly'));
  }
  const changedCards = selected.map((item) => item!.card);
  const changedSourceIndexes = selected.map((item) => item!.sourceIndex);
  const detail = {
    cards: changedCards,
    cardIds: unique,
    sourceIndexes: changedSourceIndexes,
    reason: options.reason ?? 'api',
  };
  return commit(host, {
    action: 'delete',
    previousCards,
    cards: removeKanbanRecords(previousCards, new Set(unique), (card) => card[host.idField] as KanbanCardId),
    changedCards,
    cardIds: unique,
    changedSourceIndexes,
    detail,
    options,
  });
}
export function moveCards<T extends DataType>(
  host: KanbanCommands<T, any>,
  ids: readonly KanbanCardId[],
  target: any,
  options: CommandOptions = {},
): KanbanMutationResult<T> {
  if (!host.active) {
    return fail('inactive', host.message('inactive'));
  }
  const restriction = host.restrict('move', ids);
  if (restriction) {
    host.moveRejected?.(ids, target, restriction);
    return fail('readonly', restriction);
  }
  const previousCards = host.read();
  const plan = host.move(ids, target);
  if (!plan.ok) {
    host.moveRejected?.(ids, target, plan.reason);
    return fail('rule', plan.reason);
  }
  if (!plan.changedSourceIndexes.length) {
    host.moveUnchanged?.();
    return { ok: true, cards: [], cardIds: ids };
  }
  const reason = options.reason ?? 'api';
  const detail = {
    cardIds: plan.movedCardIds,
    cards: plan.previousCards,
    previousCards: plan.previousCards,
    proposedCards: plan.movedCards,
    previousLocations: plan.previousLocations,
    target,
    reason,
  };
  return commit(host, {
    action: 'move',
    previousCards,
    cards: plan.cards,
    changedCards: plan.changedCards,
    cardIds: plan.movedCardIds,
    changedSourceIndexes: plan.changedSourceIndexes,
    detail,
    options,
    plan,
  });
}

function appendRank(cards: readonly { location: { rank: number } }[]): number | undefined {
  const maximum = cards.reduce((rank, card) => Math.max(rank, card.location.rank), 0);
  return allocateFractionalRanks({ beforeRank: maximum, count: 1 })?.[0];
}
