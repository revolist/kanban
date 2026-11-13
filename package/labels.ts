import type { KanbanLabels } from './types.js';
export const DEFAULT_KANBAN_LABELS: KanbanLabels = {
  newCard: 'New card',
  expandColumn: 'Expand column',
  collapseColumn: 'Collapse column',
  add: 'Add card',
  edit: 'Edit card',
  delete: 'Delete',
  save: 'Save',
  cancel: 'Cancel',
  title: 'Title',
  description: 'Description',
  column: 'Column',
  search: 'Search cards',
  board: 'Kanban board',
  selected: (count) => `${count} selected`,
  moved: (count) => `${count} cards moved`,
  changed: (count) => `${count} cards changed`,
  invalid: 'Invalid or duplicate card identity.',
  readonly: 'This board or card is read-only.',
  rejected: 'Change rejected.',
  wip: (limit) => `Column WIP limit ${limit} exceeded.`,
  unsupported: (feature) => `Unsupported Community capability: ${feature}.`,
};
export const resolveKanbanLabels = (labels?: Partial<KanbanLabels>): KanbanLabels => ({
  ...DEFAULT_KANBAN_LABELS,
  ...labels,
});
