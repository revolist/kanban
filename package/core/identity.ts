import type { ColumnProp, DataType } from '@revolist/revogrid';
import type { KanbanCardId, KanbanColumnDefinition, KanbanColumnProp } from '../types.js';

export type KanbanIdentity = KanbanCardId | KanbanColumnProp;

/** Keeps numeric and string identifiers distinct in maps and serialized row fields. */
export function kanbanIdKey(id: KanbanIdentity): string {
  return `${typeof id}:${String(id)}`;
}

export function resolveKanbanColumnName<T extends DataType>(column: KanbanColumnDefinition<T>): string {
  return column.name ?? String(column.prop);
}

export function readKanbanField<T extends DataType>(card: T, field: ColumnProp): unknown {
  return card[field as keyof T];
}

export function writeKanbanFields<T extends DataType>(card: T, patch: ReadonlyMap<ColumnProp, unknown>): T {
  const next: DataType = { ...card };
  for (const [field, value] of patch) {
    next[field] = value;
  }
  return next as T;
}

export function isKanbanId(value: unknown): value is KanbanIdentity {
  return (typeof value === 'string' && value.length > 0) || (typeof value === 'number' && Number.isFinite(value));
}
