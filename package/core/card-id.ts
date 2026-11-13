import type { ColumnProp, DataType } from '@revolist/revogrid';

export function createKanbanCardId<T extends DataType>(cards: readonly T[], idField: ColumnProp): string {
  const ids = new Set(cards.map((card) => String(card[idField as keyof T])));
  const prefix = `card-${Date.now().toString(36)}`;
  let id = prefix;
  let index = 1;
  while (ids.has(id)) {
    id = `${prefix}-${index++}`;
  }
  return id;
}
