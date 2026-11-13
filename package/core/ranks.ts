import type { DataType } from '@revolist/revogrid';
import type { KanbanCardId, KanbanProjectedCard } from '../types.js';

export const KANBAN_RANK_SPACING = 1024;
const MIN_RANK_GAP = 1e-7;

export interface AllocateKanbanRanksOptions {
  readonly beforeRank?: number;
  readonly afterRank?: number;
  readonly count: number;
  readonly spacing?: number;
  readonly minimumGap?: number;
}

/** Allocates ordered ranks in a gap, or returns undefined when the bucket must be rebalanced. */
export function allocateFractionalRanks(options: AllocateKanbanRanksOptions): readonly number[] | undefined {
  const count = Math.max(0, Math.trunc(options.count));
  if (!count) {
    return [];
  }
  const spacing = positiveFinite(options.spacing, KANBAN_RANK_SPACING);
  const minimumGap = positiveFinite(options.minimumGap, MIN_RANK_GAP);
  const before = finiteOrUndefined(options.beforeRank);
  const after = finiteOrUndefined(options.afterRank);

  if (before === undefined && after === undefined) {
    return validRanks(Array.from({ length: count }, (_, index) => (index + 1) * spacing));
  }
  if (before === undefined && after !== undefined) {
    const first = after - spacing * count;
    const ranks = Array.from({ length: count }, (_, index) => first + spacing * index);
    return validRanks(ranks, undefined, after);
  }
  if (before !== undefined && after === undefined) {
    const ranks = Array.from({ length: count }, (_, index) => before + spacing * (index + 1));
    return validRanks(ranks, before);
  }

  const gap = (after as number) - (before as number);
  const step = gap / (count + 1);
  const scale = Math.max(1, Math.abs(before as number), Math.abs(after as number));
  if (!Number.isFinite(step) || step <= Math.max(minimumGap, Number.EPSILON * scale * 4)) {
    return undefined;
  }
  const ranks = Array.from({ length: count }, (_, index) => (before as number) + step * (index + 1));
  return validRanks(ranks, before, after);
}

export function createRebalancedKanbanRanks<T extends DataType>(
  cards: readonly Pick<KanbanProjectedCard<T>, 'id'>[],
  spacing = KANBAN_RANK_SPACING,
): ReadonlyMap<KanbanCardId, number> {
  return new Map(cards.map((card, index) => [card.id, (index + 1) * spacing]));
}

function finiteOrUndefined(value: number | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function positiveFinite(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

function validRanks(ranks: readonly number[], before?: number, after?: number): readonly number[] | undefined {
  return ranks.every(
    (rank, index) =>
      Number.isFinite(rank) &&
      rank > (index === 0 ? (before ?? Number.NEGATIVE_INFINITY) : ranks[index - 1]) &&
      rank < (after ?? Number.POSITIVE_INFINITY),
  )
    ? ranks
    : undefined;
}
