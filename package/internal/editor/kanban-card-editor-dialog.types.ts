import type { TemporalPickerOptions } from '@revolist/ui/date-time';
import type { ColumnProp, DataType } from '@revolist/revogrid';
import type { KanbanCardId, KanbanMutationResult } from '../../types.js';
export interface EditorRequest<T extends DataType = DataType> {
  readonly card?: T;
  readonly cardId?: KanbanCardId;
  readonly cards?: readonly T[];
  readonly cardIds?: readonly KanbanCardId[];
  readonly columnProp?: ColumnProp;
}

export type KanbanCardEditorMode = 'create' | 'edit';
export type KanbanCardEditorFieldKind =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'tags'
  | 'checkbox'
  | 'date'
  | 'datetime'
  | 'color'
  | 'assignees'
  | 'custom';

export interface KanbanCardEditorOption {
  readonly value: string | number;
  readonly label: string;
  readonly avatar?: unknown;
  readonly disabled?: boolean;
}

export interface KanbanCardEditorFieldContext<T extends DataType = DataType> {
  readonly grid: HTMLRevoGridElement;
  readonly mode: KanbanCardEditorMode;
  readonly card: T | null;
  readonly draft: T;
  readonly field: KanbanCardEditorField<T>;
}

export interface KanbanCardEditorFieldRendererLifecycle<T extends DataType = DataType> {
  update?(context: KanbanCardEditorFieldRendererContext<T>): void;
  destroy?(): void;
}

export interface KanbanCardEditorFieldRendererContext<
  T extends DataType = DataType,
> extends KanbanCardEditorFieldContext<T> {
  readonly value: unknown;
  readonly error?: string;
  readonly disabled: boolean;
  readonly setValue: (value: unknown) => void;
}

export interface KanbanCardEditorDomRenderer<T extends DataType = DataType> {
  mount(
    container: HTMLElement,
    context: KanbanCardEditorRendererContext<T>,
  ): void | KanbanCardEditorRendererLifecycle<T>;
}

export interface KanbanCardEditorRendererLifecycle<T extends DataType = DataType> {
  update?(context: KanbanCardEditorRendererContext<T>): void;
  destroy?(): void;
}

export interface KanbanCardEditorFieldDomRenderer<T extends DataType = DataType> {
  mount(
    container: HTMLElement,
    context: KanbanCardEditorFieldRendererContext<T>,
  ): void | KanbanCardEditorFieldRendererLifecycle<T>;
}

export interface KanbanCardEditorField<T extends DataType = DataType> {
  readonly id: string;
  readonly label?: string;
  readonly kind?: KanbanCardEditorFieldKind;
  /** Shared calendar options for date/datetime fields; parsing and timezone stay with Kanban. */
  readonly datePicker?: Omit<TemporalPickerOptions, 'kind' | 'selection'>;
  readonly field?: ColumnProp;
  readonly icon?: string;
  readonly order?: number;
  readonly hidden?: boolean | ((context: KanbanCardEditorFieldContext<T>) => boolean);
  readonly fullWidth?: boolean;
  readonly defaultValue?: unknown | ((context: Omit<KanbanCardEditorFieldContext<T>, 'field'>) => unknown);
  readonly options?:
    | readonly KanbanCardEditorOption[]
    | ((context: KanbanCardEditorFieldContext<T>) => readonly KanbanCardEditorOption[]);
  readonly placeholder?: string;
  readonly readonly?: boolean | ((context: KanbanCardEditorFieldContext<T>) => boolean);
  readonly required?: boolean;
  readonly read?: (card: T, context: KanbanCardEditorFieldContext<T>) => unknown;
  readonly write?: (value: unknown, card: T, context: KanbanCardEditorFieldContext<T>) => Partial<T>;
  readonly format?: (value: unknown, context: KanbanCardEditorFieldContext<T>) => unknown;
  readonly parse?: (value: unknown, context: KanbanCardEditorFieldContext<T>) => unknown;
  readonly validate?: (
    value: unknown,
    context: KanbanCardEditorFieldContext<T>,
  ) => string | void | Promise<string | void>;
  readonly renderer?: KanbanCardEditorFieldDomRenderer<T>;
}

export type KanbanCardEditorValidationReason = 'submit' | 'manual';
export type KanbanCardEditorValidationErrors = Readonly<Record<string, string>>;
export type KanbanCardEditorFieldValidationStatus = 'valid' | 'invalid' | 'skipped' | 'cancelled';

export interface KanbanCardEditorValidationContext<T extends DataType = DataType> {
  readonly grid: HTMLRevoGridElement;
  readonly mode: KanbanCardEditorMode;
  readonly card: T | null;
  readonly draft: T;
  readonly fields: readonly KanbanCardEditorField<T>[];
  readonly reason: KanbanCardEditorValidationReason;
}

export interface KanbanCardEditorValidationResult {
  readonly valid: boolean;
  readonly cancelled: boolean;
  readonly errors: KanbanCardEditorValidationErrors;
}

export interface KanbanCardEditorValidationStartDetail<
  T extends DataType = DataType,
> extends KanbanCardEditorValidationContext<T> {
  readonly errors: Record<string, string>;
  readonly setError: (fieldId: string, error?: string) => void;
}

export interface KanbanCardEditorBeforeFieldValidationDetail<
  T extends DataType = DataType,
> extends KanbanCardEditorValidationContext<T> {
  readonly field: KanbanCardEditorField<T>;
  readonly value: unknown;
  error?: string;
  readonly setError: (error?: string) => void;
}

export interface KanbanCardEditorFieldValidationDetail<
  T extends DataType = DataType,
> extends KanbanCardEditorValidationContext<T> {
  readonly field: KanbanCardEditorField<T>;
  readonly value: unknown;
  readonly error?: string;
  readonly status: KanbanCardEditorFieldValidationStatus;
}

export interface KanbanCardEditorValidationCompleteDetail<
  T extends DataType = DataType,
> extends KanbanCardEditorValidationContext<T> {
  readonly result: KanbanCardEditorValidationResult;
}

export type KanbanCardEditorFormValidationResult = string | KanbanCardEditorValidationErrors | void;

export type KanbanCardEditorFormValidator<T extends DataType = DataType> = (
  context: KanbanCardEditorValidationContext<T>,
) => KanbanCardEditorFormValidationResult | Promise<KanbanCardEditorFormValidationResult>;

export interface KanbanCardEditorDraftState<T extends DataType = DataType> {
  readonly mode: KanbanCardEditorMode;
  readonly card: T | null;
  readonly draft: T;
  readonly dirty: boolean;
  readonly pending: boolean;
  readonly errors: Readonly<Record<string, string>>;
}

export interface KanbanCardEditorDraftController<T extends DataType = DataType> {
  getState(): KanbanCardEditorDraftState<T>;
  setValue(fieldId: string, value: unknown): void;
  setDraft(patch: Partial<T>): void;
  setErrors(errors: Readonly<Record<string, string>>): void;
  reset(): void;
  close(): void;
  validate(): Promise<KanbanCardEditorValidationResult>;
  submit(): void;
  delete(): void;
}

export interface KanbanCardEditorRendererContext<T extends DataType = DataType> {
  readonly grid: HTMLRevoGridElement;
  readonly open: boolean;
  readonly fields: readonly KanbanCardEditorField<T>[];
  readonly state: KanbanCardEditorDraftState<T>;
  readonly controller: KanbanCardEditorDraftController<T>;
}

export interface KanbanCardEditorSubmitContext<T extends DataType = DataType> {
  readonly grid: HTMLRevoGridElement;
  readonly mode: KanbanCardEditorMode;
  readonly card: T | null;
  readonly draft: T;
  readonly result?: KanbanMutationResult<T>;
}

export interface KanbanCardEditorDeleteContext<T extends DataType = DataType> {
  readonly grid: HTMLRevoGridElement;
  readonly cards: readonly T[];
  readonly cardIds: readonly KanbanCardId[];
}

export interface KanbanCardEditorDialogOptions<T extends DataType = DataType> {
  readonly fields?: readonly KanbanCardEditorField<T>[];
  readonly hiddenFields?: readonly string[];
  readonly fieldOrder?: readonly string[];
  readonly createDraft?: (context: {
    readonly grid: HTMLRevoGridElement;
    readonly request: EditorRequest<T>;
  }) => Partial<T> | Promise<Partial<T>>;
  readonly createCardId?: (context: {
    readonly grid: HTMLRevoGridElement;
    readonly cards: readonly T[];
  }) => KanbanCardId | Promise<KanbanCardId>;
  readonly validate?: KanbanCardEditorFormValidator<T>;
  readonly onSubmit?: (context: KanbanCardEditorSubmitContext<T>) => boolean | void | Promise<boolean | void>;
  readonly onDelete?: (context: KanbanCardEditorDeleteContext<T>) => boolean | void | Promise<boolean | void>;
  readonly confirmDelete?: boolean | ((context: KanbanCardEditorDeleteContext<T>) => boolean | Promise<boolean>);
  readonly confirmDiscard?: boolean | ((state: KanbanCardEditorDraftState<T>) => boolean | Promise<boolean>);
  readonly customization?: { readonly editor?: KanbanCardEditorDomRenderer<T> };
  readonly labels?: Partial<KanbanCardEditorLabels>;
}

export interface KanbanCardEditorLabels {
  readonly newCard: string;
  readonly untitledCard: string;
  readonly cancel: string;
  readonly save: string;
  readonly delete: string;
  readonly close: string;
  readonly deleteConfirm: string;
  readonly discardConfirm: string;
  readonly required: string;
  readonly validationSummary: string;
}

export interface KanbanCardEditorOpenRequest<T extends DataType = DataType> {
  readonly mode: KanbanCardEditorMode;
  readonly card?: T;
  readonly cardId?: KanbanCardId;
  readonly cardIds?: readonly KanbanCardId[];
  readonly columnProp?: ColumnProp;
  readonly request?: EditorRequest<T>;
}
