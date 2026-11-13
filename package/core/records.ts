/** Canonical source operations shared by column and commercial product projections. */
export function insertKanbanRecord<T>(records: readonly T[], card: T, sourceIndex: number): T[] {
  const next = [...records];
  next.splice(Math.max(0, Math.min(next.length, sourceIndex)), 0, card);
  return next;
}
export function replaceKanbanRecord<T>(records: readonly T[], card: T, sourceIndex: number): T[] {
  const next = [...records];
  next[sourceIndex] = card;
  return next;
}
export function removeKanbanRecords<T, Id>(records: readonly T[], ids: ReadonlySet<Id>, getId: (card: T) => Id): T[] {
  return records.filter((card) => !ids.has(getId(card)));
}
