/**
 * One atomic commit boundary for local and product-contributed placement plans.
 * Product adapters own validation/projection and optional side effects. The
 * canonical commit owns cancellation and synchronous source replacement fences.
 */
export interface KanbanTransaction<T> {
  readonly previous: readonly T[];
  readonly next: readonly T[];
  readonly read: () => readonly T[];
  readonly before: () => boolean;
  readonly apply: (cards: readonly T[]) => void;
  readonly committed?: () => void;
}
export function commitKanbanTransaction<T>(transaction: KanbanTransaction<T>): 'committed' | 'cancelled' | 'stale' {
  if (!transaction.before()) {
    return 'cancelled';
  }
  if (transaction.read() !== transaction.previous) {
    return 'stale';
  }
  transaction.apply(transaction.next);
  transaction.committed?.();
  return 'committed';
}
