import type { ColumnProp, DataType, HyperFunc, VNode } from '@revolist/revogrid';
import type { ViewFieldMap, ResourceIdentity } from '@revolist/grid-runtime';
export type KanbanCardId = string | number;
export type KanbanColumnProp = ColumnProp;
export interface KanbanColumnDefinition<T extends DataType = DataType> {
  readonly prop: KanbanColumnProp;
  readonly name?: string;
  readonly size?: number;
  readonly minSize?: number;
  readonly maxSize?: number;
  readonly wipLimit?: number;
  readonly collapsed?: boolean;
  readonly collapsible?: boolean;
  readonly allowedFrom?: readonly KanbanColumnProp[];
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly cardFilter?: (card: T) => boolean;
}
export interface KanbanProjectedCard<T extends DataType = DataType> {
  readonly id: KanbanCardId;
  readonly card: T;
  readonly sourceIndex: number;
  readonly mutable: boolean;
  readonly location: { readonly columnProp: KanbanColumnProp; readonly index: number; readonly rank: number };
}
export interface KanbanProjection<T extends DataType = DataType> {
  readonly cards: readonly KanbanProjectedCard<T>[];
  readonly columns: readonly KanbanColumnDefinition<T>[];
  readonly visibleCardIds: ReadonlySet<KanbanCardId>;
  readonly cardById: ReadonlyMap<KanbanCardId, KanbanProjectedCard<T>>;
  readonly diagnostics: readonly { code: string; message: string; blocking: boolean }[];
}
export interface KanbanFilterConfig<T extends DataType = DataType> {
  readonly query?: string;
  readonly fields?: readonly ColumnProp[];
  readonly predicate?: (card: T) => boolean;
}
export interface KanbanCardConfig<T extends DataType = DataType> {
  readonly titleField?: ColumnProp;
  readonly descriptionField?: ColumnProp;
  readonly title?: (card: T) => string;
  readonly description?: (card: T) => string | undefined;
}
export interface KanbanLabels {
  readonly newCard: string;
  readonly expandColumn: string;
  readonly collapseColumn: string;
  readonly add: string;
  readonly edit: string;
  readonly delete: string;
  readonly save: string;
  readonly cancel: string;
  readonly title: string;
  readonly description: string;
  readonly column: string;
  readonly search: string;
  readonly board: string;
  readonly selected: (count: number) => string;
  readonly moved: (count: number) => string;
  readonly changed: (count: number) => string;
  readonly invalid: string;
  readonly readonly: string;
  readonly rejected: string;
  readonly rankExhausted: string;
  readonly required: string;
  readonly validationSummary: string;
  readonly wip: (limit: number) => string;
  readonly unsupported: (feature: string) => string;
}
export interface KanbanConfig<T extends DataType = DataType> {
  readonly columns?: readonly KanbanColumnDefinition<T>[];
  readonly idField?: ColumnProp;
  readonly columnField?: ColumnProp;
  readonly orderField?: ColumnProp;
  readonly fields?: ViewFieldMap;
  readonly resources?: readonly ResourceIdentity[];
  readonly card?: KanbanCardConfig<T>;
  readonly filter?: KanbanFilterConfig<T>;
  readonly readOnly?: boolean;
  readonly locale?: string;
  readonly labels?: Partial<KanbanLabels>;
  readonly cardRowHeight?: number;
  readonly wipBehavior?: 'warn' | 'block';
  readonly selection?: { readonly mode?: 'single' | 'multiple'; readonly selectedIds?: readonly KanbanCardId[] };
  readonly rules?: {
    readonly canDrag?: (card: T) => boolean | string;
    readonly canSelect?: (card: T) => boolean;
    readonly canEdit?: (card: T) => boolean;
    readonly canDrop?: (context: {
      cards: readonly T[];
      sourceColumnProps: readonly ColumnProp[];
      targetColumn: KanbanColumnDefinition<T>;
    }) => boolean | string;
  };
  readonly customization?: {
    readonly cardContent?: (
      h: (tag: string, props?: Record<string, unknown>, children?: unknown) => VNode,
      context: { card: T; column: KanbanColumnDefinition<T>; selected: boolean },
    ) => VNode | string | number | null | undefined;
  };
}
export interface KanbanMoveTarget {
  readonly columnProp: ColumnProp;
  readonly index?: number;
  readonly beforeCardId?: KanbanCardId;
}
export interface KanbanCreateOptions {
  readonly [key: string]: unknown;
  readonly columnProp?: ColumnProp;
  readonly sourceIndex?: number;
  readonly reason?: 'api' | 'editor';
}
export interface KanbanUpdateOptions {
  readonly columnProp?: ColumnProp;
  readonly [key: string]: unknown;
  readonly reason?: 'api' | 'editor';
}
export type KanbanDeleteOptions = KanbanUpdateOptions;
export interface KanbanMoveOptions {
  readonly reason?: string;
}
export type KanbanMutationResult<T extends DataType = DataType> =
  | { readonly ok: true; readonly cards: readonly T[]; readonly cardIds: readonly KanbanCardId[] }
  | { readonly ok: false; readonly code: string; readonly reason: string };
