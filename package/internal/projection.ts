import type { ColumnProp, DataType } from '@revolist/revogrid';
import type { KanbanConfig, KanbanProjection } from '../types.js';
import { kanbanIdKey, isKanbanId } from '../core/identity.js';
import { cardMatchesKanbanFilter } from './filtering.js';
import { resolveKanbanLabels } from '../labels.js';
/** Pure local projection: planning never writes speculative state to the source owner. */
export function createCommunityProjection<T extends DataType>(
  records: readonly T[],
  config: KanbanConfig<T>,
): KanbanProjection<T> {
  const labels = resolveKanbanLabels(config.labels);
  const idField = config.fields?.id ?? config.idField ?? 'id';
  const columnField = config.fields?.status ?? config.columnField ?? 'status';
  const orderField = config.orderField ?? 'order';
  const seen = new Set<string>();
  const diagnostics: { code: string; message: string; blocking: boolean }[] = [];
  const columns = (config.columns ?? []).filter((column) => {
    const key = kanbanIdKey(column.prop);
    if (seen.has(key)) {
      diagnostics.push({ code: 'duplicate-column-prop', message: labels.invalid, blocking: true });
      return false;
    }
    seen.add(key);
    return true;
  });
  const byColumn = new Map(columns.map((column) => [column.prop, column]));
  const columnCounts = new Map<ColumnProp, number>();
  const counts = new Map<string, number>();
  for (const card of records) {
    const column = card[columnField] as ColumnProp;
    columnCounts.set(column, (columnCounts.get(column) ?? 0) + 1);
    const id = card[idField];
    if (isKanbanId(id)) {
      counts.set(kanbanIdKey(id), (counts.get(kanbanIdKey(id)) ?? 0) + 1);
    }
  }
  const cards = records
    .flatMap((card, sourceIndex) => {
      const id = card[idField];
      const column = byColumn.get(card[columnField] as ColumnProp);
      if (!isKanbanId(id) || counts.get(kanbanIdKey(id)) !== 1) {
        diagnostics.push({ code: 'invalid-card-id', message: labels.invalid, blocking: true });
        return [];
      }
      if (!column) {
        return [];
      }
      const rank =
        typeof card[orderField] === 'number' && Number.isFinite(card[orderField])
          ? (card[orderField] as number)
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
  const titleField = config.fields?.title ?? config.card?.titleField ?? 'title';
  const visible = cards.filter(
    (p) =>
      cardMatchesKanbanFilter(p.card, {
        card: { titleField },
        filter: config.filter,
        locale: config.locale,
      }) &&
      (byColumn.get(p.location.columnProp)?.cardFilter?.(p.card) ?? true),
  );
  for (const column of columns) {
    const count = columnCounts.get(column.prop) ?? 0;
    if (column.wipLimit !== undefined && count > column.wipLimit) {
      diagnostics.push({ code: 'column-wip-exceeded', message: labels.wip(column.wipLimit), blocking: false });
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
