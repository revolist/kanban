import type { ColumnProp, DataType } from '@revolist/revogrid';
import type { KanbanCardId } from '../types.js';
import { kanbanIdKey, writeKanbanFields } from '../core/identity.js';
import { allocateFractionalRanks, createRebalancedKanbanRanks } from '../core/ranks.js';
export interface MoveCard<T extends DataType> {
  readonly id: KanbanCardId;
  readonly card: T;
  readonly sourceIndex: number;
  readonly mutable: boolean;
  readonly location: { readonly index: number; readonly rank: number };
}
/** Ranking, immutable record patching and batch atomicity are edition-independent. */
export function planKanbanMove<
  T extends DataType,
  P extends MoveCard<T>,
  Projection extends {
    readonly cardById: ReadonlyMap<KanbanCardId, P>;
  },
  Validation,
>(options: {
  readonly cards: readonly T[];
  readonly selected: readonly P[];
  readonly targetBucket: readonly P[];
  readonly target: { readonly index?: number; readonly beforeCardId?: KanbanCardId };
  readonly orderField: ColumnProp;
  readonly values: ReadonlyMap<ColumnProp, unknown>;
  readonly projection: Projection;
  readonly validation: Validation;
  readonly isNoop?: boolean;
  readonly canRebalanceCard?: (card: P) => boolean;
  readonly projectCards: (cards: readonly T[], changedSourceIndexes: readonly number[]) => Projection;
  readonly immutableMessage: string;
  readonly projectionMessage: string;
}) {
  const { selected, targetBucket, validation } = options;
  const selectedKeys = new Set(selected.map((card) => kanbanIdKey(card.id)));
  const previousCards = selected.map((card) => card.card);
  const previousLocations = selected.map((card) => ({ ...card.location }) as P['location']);
  const stationaryTargetCards = targetBucket.filter((card) => !selectedKeys.has(kanbanIdKey(card.id)));
  const insertionIndex = resolveInsertionIndex(options.target, targetBucket, stationaryTargetCards, selectedKeys);
  const before = stationaryTargetCards[insertionIndex - 1];
  const after = stationaryTargetCards[insertionIndex];
  let allocated = allocateFractionalRanks({
    beforeRank: before?.location.rank,
    afterRank: after?.location.rank,
    count: selected.length,
  });
  const destinationOrder = [
    ...stationaryTargetCards.slice(0, insertionIndex),
    ...selected,
    ...stationaryTargetCards.slice(insertionIndex),
  ];
  const preservesTargetOrder =
    options.isNoop ??
    (destinationOrder.length === targetBucket.length &&
      destinationOrder.every((card, index) => card.id === targetBucket[index].id));
  if (preservesTargetOrder) {
    return {
      ok: true as const,
      cards: options.cards,
      movedCardIds: selected.map((card) => card.id),
      movedCards: selected.map((card) => card.card),
      previousCards,
      previousLocations,
      currentLocations: selected.map((card) => card.location as P['location']),
      changedCards: [],
      changedSourceIndexes: [],
      changedCardIdsAreUnique: true,
      rebalancedCardIds: [],
      validation,
      projection: options.projection,
    };
  }
  const rebalancedRanks = allocated ? undefined : createRebalancedKanbanRanks(destinationOrder);
  if (
    rebalancedRanks &&
    options.canRebalanceCard &&
    stationaryTargetCards.some(
      (card) => rebalancedRanks.get(card.id) !== card.location.rank && !options.canRebalanceCard?.(card),
    )
  ) {
    return { ok: false as const, cards: options.cards, reason: options.immutableMessage };
  }
  if (!allocated) {
    allocated = selected.map((card) => rebalancedRanks?.get(card.id) as number);
  }

  const movedRankById = new Map(selected.map((card, index) => [kanbanIdKey(card.id), allocated?.[index] as number]));
  const rebalancedKeys = new Set<string>();
  if (rebalancedRanks) {
    for (const card of stationaryTargetCards) {
      if (rebalancedRanks.get(card.id) !== card.location.rank) {
        rebalancedKeys.add(kanbanIdKey(card.id));
      }
    }
  }
  const changedSourceIndexes = new Set<number>();
  let changedCardIdsAreUnique = true;
  const nextCards = [...options.cards];
  const cardsToPatch = new Map<number, (typeof selected)[number]>();
  for (const projected of selected) {
    cardsToPatch.set(projected.sourceIndex, projected);
  }
  if (rebalancedRanks) {
    for (const projected of stationaryTargetCards) {
      if (rebalancedRanks.get(projected.id) !== projected.location.rank) {
        cardsToPatch.set(projected.sourceIndex, projected);
      }
    }
  }
  for (const [sourceIndex, projected] of cardsToPatch) {
    const selectedRank = movedRankById.get(kanbanIdKey(projected.id));
    const rebalancedRank = rebalancedRanks?.get(projected.id);
    if (selectedRank === undefined && rebalancedRank === undefined) {
      continue;
    }
    const patch = new Map();
    patch.set(options.orderField, selectedRank ?? rebalancedRank);
    if (selectedRank !== undefined) {
      for (const [field, value] of options.values) {
        patch.set(field, value);
      }
    }
    changedSourceIndexes.add(sourceIndex);
    changedCardIdsAreUnique &&= projected.mutable;
    nextCards[sourceIndex] = writeKanbanFields(nextCards[sourceIndex], patch);
  }
  const sortedChangedSourceIndexes = [...changedSourceIndexes].sort((a, b) => a - b);
  const nextProjection = options.projectCards(nextCards, sortedChangedSourceIndexes);
  const movedCardIds = selected.map((card) => card.id);
  const movedCards = selected.map((card) => nextCards[card.sourceIndex]);
  const currentLocations: P['location'][] = movedCardIds
    .map((id) => nextProjection.cardById.get(id)?.location as P['location'] | undefined)
    .filter((location): location is P['location'] => location !== undefined);
  if (currentLocations.length !== movedCardIds.length) {
    return { ok: false as const, cards: options.cards, reason: options.projectionMessage };
  }
  return {
    ok: true as const,
    cards: nextCards,
    movedCardIds,
    movedCards,
    previousCards,
    previousLocations,
    currentLocations,
    changedCards: sortedChangedSourceIndexes.map((index) => nextCards[index]),
    changedSourceIndexes: sortedChangedSourceIndexes,
    changedCardIdsAreUnique,
    rebalancedCardIds: destinationOrder
      .filter((card) => rebalancedKeys.has(kanbanIdKey(card.id)))
      .map((card) => card.id),
    validation,
    projection: nextProjection,
  };
}

export function resolveInsertionIndex(
  target: { readonly index?: number; readonly beforeCardId?: KanbanCardId },
  fullBucket: readonly {
    readonly id: KanbanCardId;
    readonly location: { readonly index: number };
  }[],
  stationary: readonly { readonly id: KanbanCardId }[],
  selectedKeys: ReadonlySet<string>,
): number {
  if (target.beforeCardId !== undefined) {
    const index = stationary.findIndex(
      (card) => kanbanIdKey(card.id) === kanbanIdKey(target.beforeCardId as KanbanCardId),
    );
    if (index >= 0) {
      return index;
    }
    const fullIndex = fullBucket.findIndex(
      (card) => kanbanIdKey(card.id) === kanbanIdKey(target.beforeCardId as KanbanCardId),
    );
    if (fullIndex < 0) {
      return stationary.length;
    }
    const selectedBefore = fullBucket
      .slice(0, fullIndex)
      .filter((card) => selectedKeys.has(kanbanIdKey(card.id))).length;
    return Math.max(0, Math.min(stationary.length, fullIndex - selectedBefore));
  }
  if (target.index === undefined) {
    return stationary.length;
  }
  const requested = normalizeTargetIndex(target.index, fullBucket.length);
  const selectedBefore = fullBucket.slice(0, requested).filter((card) => selectedKeys.has(kanbanIdKey(card.id))).length;
  return Math.max(0, Math.min(stationary.length, requested - selectedBefore));
}

export function normalizeTargetIndex(index: number, bucketSize: number): number {
  // Preserve Array#slice's established NaN behavior from the general move
  // path while sharing one explicit value with the O(1) no-op fast path.
  const requested = Number.isNaN(index) ? 0 : Math.trunc(index);
  return Math.max(0, Math.min(bucketSize, requested));
}
