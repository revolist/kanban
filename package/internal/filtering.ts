import type { DataType, ColumnProp } from '@revolist/revogrid';
import type { KanbanFilterConfig } from '../types.js';
export interface FilterContext<T extends DataType> {
  readonly card: { readonly titleField: ColumnProp };
  readonly filter?: KanbanFilterConfig<T>;
  readonly locale?: string;
}
import { readKanbanField } from '../core/identity.js';

export function cardMatchesKanbanFilter<T extends DataType>(card: T, config: FilterContext<T>): boolean {
  const filter = config.filter;
  if (!filter) {
    return true;
  }
  if (filter.predicate && !filter.predicate(card)) {
    return false;
  }
  const query = filter.query?.trim();
  if (!query) {
    return true;
  }
  const normalizedQuery = query.toLocaleLowerCase(config.locale);
  const fields = filter.fields?.length ? filter.fields : [config.card.titleField];
  return fields.some((field) =>
    String(readKanbanField(card, field) ?? '')
      .toLocaleLowerCase(config.locale)
      .includes(normalizedQuery),
  );
}

export function filterKanbanCards<T extends DataType>(
  cards: readonly T[],
  config: FilterContext<T>,
  externalPredicate?: (card: T, sourceIndex: number) => boolean,
): readonly T[] {
  return cards.filter(
    (card, index) => (externalPredicate?.(card, index) ?? true) && cardMatchesKanbanFilter(card, config),
  );
}

export function withKanbanQuery<T extends DataType>(
  filter: KanbanFilterConfig<T> | undefined,
  query: string,
): KanbanFilterConfig<T> {
  return { ...(filter ?? {}), query };
}
