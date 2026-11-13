import type { ColumnProp } from '@revolist/revogrid';
import type { ComponentChildren } from 'preact';

export type KanbanToolbarAction = 'add' | 'edit' | 'delete';
export type KanbanToolbarFilterValue = string | number | boolean;
export interface KanbanToolbarFilterOption {
  readonly value: KanbanToolbarFilterValue;
  readonly label: string;
}
export interface KanbanToolbarFilter {
  readonly id: string;
  readonly label: string;
  readonly field: ColumnProp;
  /** When omitted, distinct scalar values are read from canonical cards. Arrays are flattened. */
  readonly options?: readonly KanbanToolbarFilterOption[];
}
export interface KanbanToolbarLabels {
  readonly toolbar: string;
  readonly actions: string;
  readonly add: string;
  readonly edit: string;
  readonly delete: string;
  readonly deleteMany: (count: number) => string;
  readonly search: string;
  readonly workflow: string;
  readonly filters: string;
  readonly closeFilters: string;
  readonly done: string;
  readonly all: string;
  readonly clear: string;
  readonly views: string;
  readonly board: string;
  readonly table: string;
  readonly selection: (count: number) => string;
  readonly count: (visible: number, total: number) => string;
  readonly empty: string;
  readonly createFirst: string;
  readonly pending: string;
}
export type KanbanToolbarIcon = KanbanToolbarAction | 'search' | 'filters' | 'board' | 'table' | 'close';
export interface KanbanToolbarContext {
  readonly active: boolean;
  readonly pending: boolean;
  readonly selected: number;
  readonly total: number;
  readonly visible: number;
  readonly enabled: Readonly<Record<string, boolean>>;
}
export interface KanbanToolbarOptions {
  /** Optional root CSS class; shared Pro tokens still own control styling. */
  readonly className?: string;
  /** Show localized button labels beside icons. Defaults to the compact icon-only layout. */
  readonly showLabels?: boolean;
  readonly count?: boolean;
  readonly emptyState?: boolean;
  /** Return decorative content; accessible names remain owned by toolbar labels. */
  readonly renderIcon?: (name: KanbanToolbarIcon) => ComponentChildren;
  /** Add content around the built-in controls; callbacks receive current canonical state. */
  readonly renderStart?: (context: KanbanToolbarContext) => ComponentChildren;
  readonly renderEnd?: (context: KanbanToolbarContext) => ComponentChildren;
  readonly labels?: Partial<KanbanToolbarLabels>;
  readonly actions?: readonly string[];
  readonly search?: boolean;
  readonly workflowFilter?: boolean;
  readonly filters?: readonly KanbanToolbarFilter[];
  readonly viewSwitcher?: boolean;
}
