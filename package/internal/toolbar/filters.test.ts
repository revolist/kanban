import { expect, it } from 'vitest';
import { KanbanToolbarFilters, filterValueKey, toolbarFilterOptions } from './filters';

const definitions = [
  { id: 'priority', label: 'Priority', field: 'priority' },
  { id: 'owner', label: 'Owner', field: 'owners' },
];
it('composes toolbar filters with host predicates and query fields without mutating either', () => {
  const state = new KanbanToolbarFilters();
  const host = {
    fields: ['title'],
    predicate: (card: { archived?: boolean }) => !card.archived,
  };
  state.sync(host);
  state.query = 'API';
  state.selected.set('priority', 1);
  state.selected.set('owner', 'Mia');
  const filter = state.build(definitions);
  expect(filter.fields).toBe(host.fields);
  expect(filter.query).toBe('API');
  expect(filter.predicate?.({ priority: 1, owners: ['Mia'] })).toBe(true);
  expect(filter.predicate?.({ priority: '1', owners: ['Mia'] })).toBe(false);
  expect(filter.predicate?.({ priority: 1, owners: ['Mia'], archived: true })).toBe(false);
  state.sync(filter);
  expect(state.query).toBe('API');
  expect(state.selected.size).toBe(2);
  state.clear();
  const cleared = state.build(definitions);
  expect(cleared.predicate).toBe(host.predicate);
  expect(state.active).toBe(false);
});
it('adopts external filtering and clears stale toolbar selections', () => {
  const state = new KanbanToolbarFilters();
  state.selected.set('priority', 'high');
  state.sync({ query: 'Host query' });
  expect(state.query).toBe('Host query');
  expect(state.selected.size).toBe(0);
});
it('drops a host predicate cleared before the toolbar applies its first filter', () => {
  const state = new KanbanToolbarFilters();
  state.sync({ predicate: (card) => card.priority === 'high' });
  state.sync(undefined);
  state.query = 'Research';
  const filter = state.build(definitions);
  expect(filter.query).toBe('Research');
  expect(filter.predicate).toBeUndefined();
});
it('derives distinct typed options, flattens arrays and ignores unsupported values', () => {
  const options = toolbarFilterOptions({ id: 'x', field: 'x', label: 'Value' }, [
    { x: [1, '1', false, 1, null, {}] },
    { x: undefined },
  ]);
  expect(options.map((option) => option.value)).toEqual([1, '1', false]);
  expect(filterValueKey(1)).not.toBe(filterValueKey('1'));
});
