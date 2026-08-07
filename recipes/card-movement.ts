import type { KanbanShowcaseCard } from '../src/examples/showcase/kanban.shared';

export function moveCard(
  rows: readonly KanbanShowcaseCard[],
  cardId: string,
  status: KanbanShowcaseCard['status'],
) {
  const destination = rows.filter((row) => row.status === status && row.id !== cardId);
  return rows.map((row) => row.id === cardId
    ? { ...row, status, order: destination.length }
    : row);
}
