import {
  coerceValidDate,
  ISO_DATE_ONLY_PATTERN,
  isValidIsoDate,
  parseOffsetDateTimeValue,
} from '@revolist/ui/date-utils';
import type { DataType } from '@revolist/revogrid';
import type {
  KanbanCardEditorBeforeFieldValidationDetail,
  KanbanCardEditorField,
  KanbanCardEditorFieldContext,
  KanbanCardEditorFieldValidationDetail,
  KanbanCardEditorFormValidator,
  KanbanCardEditorValidationCompleteDetail,
  KanbanCardEditorValidationContext,
  KanbanCardEditorValidationReason,
  KanbanCardEditorValidationResult,
  KanbanCardEditorValidationStartDetail,
} from './kanban-card-editor-dialog.types.js';

export const BEFORE_KANBAN_CARD_EDITOR_VALIDATE_EVENT = 'beforekanbancardeditorvalidate';
export const BEFORE_KANBAN_CARD_EDITOR_FIELD_VALIDATE_EVENT = 'beforekanbancardeditorfieldvalidate';
export const KANBAN_CARD_EDITOR_FIELD_VALIDATE_EVENT = 'kanbancardeditorfieldvalidate';
export const KANBAN_CARD_EDITOR_VALIDATE_EVENT = 'kanbancardeditorvalidate';
export const KANBAN_CARD_EDITOR_INVALID_EVENT = 'kanbancardeditorinvalid';

export interface KanbanCardEditorValidationEvent {
  readonly defaultPrevented: boolean;
}

export interface ValidateKanbanCardEditorOptions<T extends DataType = DataType> {
  readonly grid: HTMLRevoGridElement;
  readonly mode: KanbanCardEditorValidationContext<T>['mode'];
  readonly card: T | null;
  readonly draft: T;
  readonly fields: readonly KanbanCardEditorField<T>[];
  readonly reason: KanbanCardEditorValidationReason;
  readonly requiredMessage: string;
  readonly validateForm?: KanbanCardEditorFormValidator<T>;
  readonly emit: (eventName: string, detail: unknown) => KanbanCardEditorValidationEvent;
}

/** Runs the shared packaged/replacement-editor validation and event pipeline. */
export async function validateKanbanCardEditor<T extends DataType>(
  options: ValidateKanbanCardEditorOptions<T>,
): Promise<KanbanCardEditorValidationResult> {
  const context: KanbanCardEditorValidationContext<T> = {
    grid: options.grid,
    mode: options.mode,
    card: options.card,
    draft: options.draft,
    fields: options.fields,
    reason: options.reason,
  };
  const errors: Record<string, string> = {};
  const setError = (fieldId: string, error?: string) => updateError(errors, fieldId, error);
  const startDetail: KanbanCardEditorValidationStartDetail<T> = {
    ...context,
    errors,
    setError,
  };
  let cancelled = options.emit(BEFORE_KANBAN_CARD_EDITOR_VALIDATE_EVENT, startDetail).defaultPrevented;
  if (!cancelled) {
    for (const field of options.fields) {
      cancelled = (await validateField({ options, context, field, errors })) || cancelled;
    }
    await validateForm(options.validateForm, context, errors);
  }
  return completeValidation(options.emit, context, errors, cancelled);
}

interface ValidateFieldOptions<T extends DataType> {
  readonly options: ValidateKanbanCardEditorOptions<T>;
  readonly context: KanbanCardEditorValidationContext<T>;
  readonly field: KanbanCardEditorField<T>;
  readonly errors: Record<string, string>;
}

async function validateField<T extends DataType>(input: ValidateFieldOptions<T>): Promise<boolean> {
  const { options, context, field, errors } = input;
  const fieldContext: KanbanCardEditorFieldContext<T> = {
    grid: context.grid,
    mode: context.mode,
    card: context.card,
    draft: context.draft,
    field,
  };
  let value: unknown;
  try {
    const hidden = typeof field.hidden === 'function' ? field.hidden(fieldContext) : field.hidden === true;
    if (hidden) {
      emitFieldResult(options.emit, context, field, undefined, undefined, 'skipped');
      return false;
    }
    value =
      field.read?.(context.draft, fieldContext) ?? (field.field === undefined ? undefined : context.draft[field.field]);
  } catch (error) {
    const message = validationErrorMessage(error);
    updateError(errors, field.id, message);
    emitFieldResult(options.emit, context, field, value, message, 'invalid');
    return false;
  }

  let fieldError: string | undefined = errors[field.id];
  const beforeDetail: KanbanCardEditorBeforeFieldValidationDetail<T> = {
    ...context,
    field,
    value,
    error: fieldError,
    setError: (error) => {
      fieldError = error;
      beforeDetail.error = error;
      updateError(errors, field.id, error);
    },
  };
  if (options.emit(BEFORE_KANBAN_CARD_EDITOR_FIELD_VALIDATE_EVENT, beforeDetail).defaultPrevented) {
    emitFieldResult(options.emit, context, field, value, fieldError, 'cancelled');
    return true;
  }

  try {
    if (field.required && isEmptyValidationValue(value)) {
      fieldError = options.requiredMessage;
    }
    if (!isEmptyValidationValue(value) && (field.kind === 'date' || field.kind === 'datetime')) {
      const valid =
        typeof value === 'string'
          ? ISO_DATE_ONLY_PATTERN.test(value)
            ? isValidIsoDate(value)
            : isValidIsoDate(value.slice(0, 10)) && !!parseOffsetDateTimeValue(value)
          : !!coerceValidDate(value);
      if (!valid) {
        fieldError = 'Enter a valid date.';
      }
    }
    const customError = await field.validate?.(value, fieldContext);
    if (customError) {
      fieldError = customError;
    }
  } catch (error) {
    fieldError = validationErrorMessage(error);
  }
  updateError(errors, field.id, fieldError);
  emitFieldResult(options.emit, context, field, value, fieldError, fieldError ? 'invalid' : 'valid');
  return false;
}

async function validateForm<T extends DataType>(
  validator: KanbanCardEditorFormValidator<T> | undefined,
  context: KanbanCardEditorValidationContext<T>,
  errors: Record<string, string>,
): Promise<void> {
  if (!validator) {
    return;
  }
  try {
    const result = await validator(context);
    if (typeof result === 'string') {
      updateError(errors, '_form', result);
    } else if (result) {
      for (const [fieldId, error] of Object.entries(result)) {
        updateError(errors, fieldId, error);
      }
    }
  } catch (error) {
    updateError(errors, '_form', validationErrorMessage(error));
  }
}

function emitFieldResult<T extends DataType>(
  emit: ValidateKanbanCardEditorOptions<T>['emit'],
  context: KanbanCardEditorValidationContext<T>,
  field: KanbanCardEditorField<T>,
  value: unknown,
  error: string | undefined,
  status: KanbanCardEditorFieldValidationDetail<T>['status'],
): void {
  const detail: KanbanCardEditorFieldValidationDetail<T> = {
    ...context,
    field,
    value,
    error,
    status,
  };
  emit(KANBAN_CARD_EDITOR_FIELD_VALIDATE_EVENT, detail);
}

function completeValidation<T extends DataType>(
  emit: ValidateKanbanCardEditorOptions<T>['emit'],
  context: KanbanCardEditorValidationContext<T>,
  errors: Record<string, string>,
  cancelled: boolean,
): KanbanCardEditorValidationResult {
  const result: KanbanCardEditorValidationResult = {
    valid: !cancelled && !Object.keys(errors).length,
    cancelled,
    errors: { ...errors },
  };
  const detail: KanbanCardEditorValidationCompleteDetail<T> = {
    ...context,
    result,
  };
  emit(KANBAN_CARD_EDITOR_VALIDATE_EVENT, detail);
  if (!result.valid) {
    emit(KANBAN_CARD_EDITOR_INVALID_EVENT, detail);
  }
  return result;
}

function isEmptyValidationValue(value: unknown): boolean {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length);
}

function updateError(errors: Record<string, string>, fieldId: string, error?: string): void {
  if (error) {
    errors[fieldId] = error;
  } else {
    delete errors[fieldId];
  }
}

function validationErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

declare global {
  interface HTMLRevoGridElementEventMap {
    [BEFORE_KANBAN_CARD_EDITOR_VALIDATE_EVENT]: KanbanCardEditorValidationStartDetail;
    [BEFORE_KANBAN_CARD_EDITOR_FIELD_VALIDATE_EVENT]: KanbanCardEditorBeforeFieldValidationDetail;
    [KANBAN_CARD_EDITOR_FIELD_VALIDATE_EVENT]: KanbanCardEditorFieldValidationDetail;
    [KANBAN_CARD_EDITOR_VALIDATE_EVENT]: KanbanCardEditorValidationCompleteDetail;
    [KANBAN_CARD_EDITOR_INVALID_EVENT]: KanbanCardEditorValidationCompleteDetail;
  }
}
