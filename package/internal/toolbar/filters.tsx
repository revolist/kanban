import type { DataType } from '@revolist/revogrid';
import type { KanbanFilterConfig } from '../../types.js';
import type { KanbanToolbarFilter, KanbanToolbarFilterOption, KanbanToolbarFilterValue } from './types.js';

export const filterValueKey = (value: KanbanToolbarFilterValue): string => JSON.stringify([typeof value, value]);
const scalar = (value: unknown): value is KanbanToolbarFilterValue =>
  typeof value === 'string' || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value));

export function toolbarFilterOptions(
  filter: KanbanToolbarFilter,
  cards: readonly DataType[],
): readonly KanbanToolbarFilterOption[] {
  if (filter.options) {
    return filter.options;
  }
  const values = new Map<string, KanbanToolbarFilterOption>();
  for (const card of cards) {
    const field = card[filter.field];
    for (const value of Array.isArray(field) ? field : [field]) {
      if (scalar(value)) {
        values.set(filterValueKey(value), { value, label: String(value) });
      }
    }
  }
  return [...values.values()];
}

/** Own only toolbar choices; retain the host's predicate and query fields. */
export class KanbanToolbarFilters {
  query = '';
  readonly selected = new Map<string, KanbanToolbarFilterValue>();
  private base?: KanbanFilterConfig;
  private applied?: KanbanFilterConfig;

  sync(filter?: KanbanFilterConfig): void {
    if (this.applied !== undefined && filter === this.applied) {
      return;
    }
    this.base = filter;
    this.query = filter?.query ?? '';
    this.selected.clear();
  }

  build(filters: readonly KanbanToolbarFilter[]): KanbanFilterConfig {
    const selected = filters.flatMap((filter) =>
      this.selected.has(filter.id) ? [{ field: filter.field, value: this.selected.get(filter.id)! }] : [],
    );
    const hostPredicate = this.base?.predicate;
    this.applied = {
      ...this.base,
      query: this.query,
      predicate: selected.length
        ? (card) =>
            (!hostPredicate || hostPredicate(card)) &&
            selected.every(({ field, value }) => {
              const actual = card[field];
              return Array.isArray(actual) ? actual.some((item) => item === value) : actual === value;
            })
        : hostPredicate,
    };
    return this.applied;
  }

  clear(): void {
    this.query = '';
    this.selected.clear();
  }
  get active(): boolean {
    return !!this.query || this.selected.size > 0;
  }
}
