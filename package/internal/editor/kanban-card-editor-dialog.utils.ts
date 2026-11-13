import {
  coerceValidDate,
  formatIsoDateInTimeZone,
  formatLocalIsoDateTimeInTimeZone,
  getBrowserTimeZone,
  isValidIsoDate,
  ISO_DATE_ONLY_PATTERN,
  parseIsoLocalCivilDateTime,
  parseZonedDateTimeControlValue,
} from '@revolist/ui/date-utils';
import type { DataType } from '@revolist/revogrid';
import type { KanbanCardEditorDialogProps } from './kanban-card-editor-dialog.props.js';
import type { KanbanCardEditorField, KanbanCardEditorFieldContext } from './kanban-card-editor-dialog.types.js';

export function createKanbanEditorFieldContext<T extends DataType>(
  field: KanbanCardEditorField<T>,
  props: KanbanCardEditorDialogProps<T>,
): KanbanCardEditorFieldContext<T> {
  return {
    grid: props.grid,
    mode: props.state.mode,
    card: props.state.card,
    draft: props.state.draft,
    field,
  };
}

export function readKanbanEditorFieldValue<T extends DataType>(
  field: KanbanCardEditorField<T>,
  props: KanbanCardEditorDialogProps<T>,
): unknown {
  const context = createKanbanEditorFieldContext(field, props);
  const value =
    field.read?.(props.state.draft, context) ??
    (field.field === undefined ? undefined : props.state.draft[field.field]);
  return field.format?.(value, context) ?? value;
}

export function isKanbanEditorFieldReadonly<T extends DataType>(
  field: KanbanCardEditorField<T>,
  props: KanbanCardEditorDialogProps<T>,
): boolean {
  return typeof field.readonly === 'function'
    ? field.readonly(createKanbanEditorFieldContext(field, props))
    : field.readonly === true;
}

export function isKanbanEditorFieldVisible<T extends DataType>(
  field: KanbanCardEditorField<T>,
  props: KanbanCardEditorDialogProps<T>,
): boolean {
  return typeof field.hidden === 'function'
    ? !field.hidden(createKanbanEditorFieldContext(field, props))
    : field.hidden !== true;
}

export function displayKanbanEditorFieldValue<T extends DataType>(
  value: unknown,
  field: KanbanCardEditorField<T>,
  timeZone = getBrowserTimeZone(),
): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (field.kind === 'tags' || field.kind === 'assignees') {
    return toKanbanEditorValueArray(value).join(', ');
  }
  if (field.kind === 'date' || field.kind === 'datetime') {
    if (typeof value === 'string' && ISO_DATE_ONLY_PATTERN.test(value)) {
      if (!isValidIsoDate(value)) {
        return '';
      }
      return field.kind === 'date' ? value : `${value}T00:00`;
    }
    // A rejected civil input is still a control value, not a stored instant.
    if (typeof value === 'string' && parseIsoLocalCivilDateTime(value)) {
      return value.slice(0, field.kind === 'date' ? 10 : 16);
    }
    const date = coerceValidDate(value);
    if (date) {
      return field.kind === 'date'
        ? formatIsoDateInTimeZone(date, timeZone)
        : formatLocalIsoDateTimeInTimeZone(date, timeZone).slice(0, 16);
    }
  }
  return String(value);
}

export function kanbanEditorInputType(kind: KanbanCardEditorField['kind']): string {
  if (kind === 'number') {
    return 'number';
  }
  if (kind === 'date') {
    return 'date';
  }
  if (kind === 'datetime') {
    return 'datetime-local';
  }
  return 'text';
}

export function toKanbanEditorValueArray(value: unknown): readonly unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  return value === undefined || value === null || value === '' ? [] : [value];
}

export function resolveKanbanEditorOptionValue(
  options: readonly { readonly value: string | number }[],
  value: string,
): string | number {
  return options.find((option) => String(option.value) === value)?.value ?? value;
}

/** Editor policy: preserve untouched values and the host's Date/number/string representation. */
export function parseKanbanEditorFieldValue<T extends DataType>(
  input: unknown,
  field: KanbanCardEditorField<T>,
  original: unknown,
  timeZone = getBrowserTimeZone(),
): unknown {
  if (field.kind === 'number') {
    return input === '' ? undefined : Number(input);
  }
  if ((field.kind === 'tags' || field.kind === 'assignees') && typeof input === 'string') {
    return input
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }
  if ((field.kind !== 'date' && field.kind !== 'datetime') || typeof input !== 'string') {
    return input;
  }
  if (input === displayKanbanEditorFieldValue(original, field, timeZone)) {
    return original;
  }
  if (!input) {
    return undefined;
  }
  if (field.kind === 'date' && !isValidIsoDate(input)) {
    return input;
  }
  if (field.kind === 'date' && (original == null || (typeof original === 'string' && isValidIsoDate(original)))) {
    return input;
  }
  const date = parseZonedDateTimeControlValue(
    field.kind === 'date' ? `${input}T00:00` : input,
    timeZone,
    coerceValidDate(original),
  );
  // Keep invalid input in the draft so validation can report it without throwing or normalizing it.
  if (!date) {
    return field.kind === 'date' ? `${input}T00:00` : input;
  }
  return original instanceof Date ? date : typeof original === 'number' ? date.getTime() : date.toISOString();
}
