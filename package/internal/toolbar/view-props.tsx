import type { DataType } from '@revolist/revogrid';
import type { KanbanToolbarFilters } from './filters.js';
import type { KanbanToolbarModel } from './model.js';
import type { KanbanToolbarAction, KanbanToolbarFilter, KanbanToolbarLabels, KanbanToolbarOptions } from './types.js';

export interface KanbanToolbarViewProps {
  readonly model: KanbanToolbarModel;
  readonly options: KanbanToolbarOptions;
  readonly labels: KanbanToolbarLabels;
  readonly filters: readonly KanbanToolbarFilter[];
  readonly filterState: KanbanToolbarFilters;
  readonly cards: readonly DataType[];
  readonly canSwitch: boolean;
  readonly popover: import('./popover').KanbanToolbarPopover;
  readonly onAction: (action: string) => void;
  readonly onSearch: (value: string) => void;
  readonly onFilter: (id: string, value: string) => void;
  readonly onClear: () => void;
  readonly onView: (board: boolean) => void;
}

export interface ToolbarViewSlots {
  readonly extraActions?: import('preact').ComponentChildren;
}
