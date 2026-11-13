import type { DataType } from '@revolist/revogrid';
import type {
  KanbanCardEditorDraftState,
  KanbanCardEditorField,
  KanbanCardEditorLabels,
} from './kanban-card-editor-dialog.types.js';

export interface KanbanCardEditorDialogProps<T extends DataType = DataType> {
  readonly grid: HTMLRevoGridElement;
  readonly dateTimeZone?: string;
  readonly fields: readonly KanbanCardEditorField<T>[];
  readonly state: KanbanCardEditorDraftState<T>;
  readonly labels: KanbanCardEditorLabels;
  readonly onValue: (field: KanbanCardEditorField<T>, value: unknown) => void;
  readonly onClose: () => void;
  readonly onSubmit: () => void;
  readonly onDelete: () => void;
}

export interface KanbanCardEditorFieldProps<T extends DataType = DataType> extends KanbanCardEditorDialogProps<T> {
  readonly field: KanbanCardEditorField<T>;
}
