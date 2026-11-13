import type { KanbanToolbarLabels } from './types.js';

export const DEFAULT_KANBAN_TOOLBAR_LABELS: KanbanToolbarLabels = {
  toolbar: 'Kanban toolbar',
  actions: 'Card actions',
  add: 'Add card',
  edit: 'Edit card',
  delete: 'Delete card',
  deleteMany: (count) => `Delete ${count} cards`,
  search: 'Search cards',
  workflow: 'Workflow',
  filters: 'Filters',
  closeFilters: 'Close filters',
  done: 'Done',
  all: 'All',
  clear: 'Clear filters',
  views: 'View',
  board: 'Board',
  table: 'Table',
  selection: (count) => `${count} selected`,
  count: (visible, total) =>
    visible === total ? `${total} ${total === 1 ? 'card' : 'cards'}` : `${visible} of ${total} cards`,
  empty: 'Your board is empty. Add a card to get started.',
  createFirst: 'Create first card',
  pending: 'Finish the current action before switching views.',
};
