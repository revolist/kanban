/** @jsxImportSource preact */
import { temporalDatePart, temporalTimePart, withTemporalTime } from '@revolist/ui/date-utils';
import { DateTimeField } from '@revolist/ui/date-time';
import { TextArea as UiTextarea, Input as UiInput, Select as UiSelect } from '@revolist/ui/native-control';

import type { DataType } from '@revolist/revogrid';
import { ColorPalette } from '@revolist/ui/color-palette/color-palette';
import { h } from 'preact';
import { useState } from '@revolist/ui/preact-mount';
import { MultiSelect } from '@revolist/ui/preact';
import { AvatarElement, getAvatarInitials } from '@revolist/ui/avatar/index';
import { resolveKanbanCardEditorAssigneeResources } from './kanban-card-editor-assignees.js';
import { KanbanCardEditorCustomField } from './kanban-card-editor-custom-field.js';
import type { KanbanCardEditorFieldProps } from './kanban-card-editor-dialog.props.js';
import {
  displayKanbanEditorFieldValue,
  kanbanEditorInputType,
  resolveKanbanEditorOptionValue,
  toKanbanEditorValueArray,
} from './kanban-card-editor-dialog.utils.js';
import type { KanbanCardEditorOption } from './kanban-card-editor-dialog.types.js';

export interface KanbanCardEditorFieldControlProps<
  T extends DataType = DataType,
> extends KanbanCardEditorFieldProps<T> {
  readonly value: unknown;
  readonly disabled: boolean;
  readonly options: readonly KanbanCardEditorOption[];
  readonly error?: string;
  readonly errorId?: string;
  readonly labelId: string;
}

export function KanbanCardEditorFieldControl<T extends DataType>(props: KanbanCardEditorFieldControlProps<T>) {
  const { field, value, disabled, options, error, errorId } = props;
  const [tagText, setTagText] = useState<string>();
  const validationAttributes = {
    'aria-invalid': error ? ('true' as const) : undefined,
    'aria-describedby': error ? errorId : undefined,
    'aria-labelledby': props.labelId,
  };
  if (field.renderer) {
    return <KanbanCardEditorCustomField {...props} />;
  }
  if (field.kind === 'textarea') {
    return (
      <UiTextarea
        {...validationAttributes}
        value={displayKanbanEditorFieldValue(value, field, props.dateTimeZone)}
        placeholder={field.placeholder}
        disabled={disabled}
        onInput={(event) => props.onValue(field, (event.currentTarget as HTMLTextAreaElement).value)}
      />
    );
  }
  if (field.kind === 'checkbox') {
    return (
      <UiInput
        {...validationAttributes}
        type="checkbox"
        checked={Boolean(value)}
        disabled={disabled}
        onChange={(event) => props.onValue(field, (event.currentTarget as HTMLInputElement).checked)}
      />
    );
  }
  if (field.kind === 'color') {
    return (
      <ColorPalette
        value={typeof value === 'string' ? value : null}
        disabled={disabled}
        ariaLabel={field.label ?? field.id}
        defaultLabel="Default"
        colorAriaLabel={(option) => option.label}
        onChange={(next) => props.onValue(field, next)}
      />
    );
  }
  if (field.kind === 'assignees') {
    const renderAssignee = ({ label, avatar }: { label: string; avatar?: unknown }) => (
      <span class="avatar-cell-with-text">
        <span aria-hidden="true" style={{ display: 'inline-flex' }}>
          <AvatarElement
            options={{
              value: avatar ?? label,
              label,
              initials: getAvatarInitials(label),
              size: 20,
            }}
          />
        </span>
        <span class="avatar-cell-with-text__label">{label}</span>
      </span>
    );
    return (
      <MultiSelect
        source={[...resolveKanbanCardEditorAssigneeResources(options, value)]}
        value={toKanbanEditorValueArray(value) as (string | number)[]}
        disabled={disabled}
        triggerAttributes={validationAttributes}
        renderValue={(_, option) => renderAssignee(option)}
        renderOption={(_, option, selected) => (
          <div class="option-content">
            <UiInput
              type="checkbox"
              checked={selected}
              readOnly
              disabled={option.disabled}
              tabIndex={-1}
              aria-hidden="true"
            />
            {renderAssignee(option)}
          </div>
        )}
        config={{
          ariaLabel: field.label ?? field.id,
          search: true,
          searchPlaceholder: field.placeholder ?? 'Search people',
          searchAriaLabel: `Search ${field.label ?? field.id}`,
          topLayer: true,
          nativeTabNavigation: true,
        }}
        onChange={(next) => props.onValue(field, Array.isArray(next) ? next : [next])}
      />
    );
  }
  if (field.kind === 'select') {
    return (
      <UiSelect
        aria-label={field.label ?? field.id}
        {...validationAttributes}
        value={String(value ?? '')}
        disabled={disabled}
        onValueChange={(event) => props.onValue(field, resolveKanbanEditorOptionValue(options, event))}
      >
        <option value="">Select…</option>
        {options.map((option) => (
          <option key={String(option.value)} value={String(option.value)} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </UiSelect>
    );
  }
  if (field.kind === 'multiselect') {
    const selectedValues = new Set(toKanbanEditorValueArray(value).map(String));
    return (
      <UiSelect
        aria-label={field.label ?? field.id}
        {...validationAttributes}
        multiple
        value={[...selectedValues]}
        disabled={disabled}
        onValueChange={(event) =>
          props.onValue(
            field,
            event.map((value) => resolveKanbanEditorOptionValue(options, value)),
          )
        }
      >
        {options.map((option) => (
          <option
            key={String(option.value)}
            value={String(option.value)}
            selected={selectedValues.has(String(option.value))}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </UiSelect>
    );
  }
  if (field.kind === 'date' || field.kind === 'datetime') {
    const display = displayKanbanEditorFieldValue(value, field, props.dateTimeZone);
    const picker = {
      ...field.datePicker,
      calendar: { ...field.datePicker?.calendar, timeZone: props.dateTimeZone },
    };
    const dateFieldProps = {
      ...validationAttributes,
      livePickerUpdates: true,
      disabled,
      required: field.required,
      picker,
    };
    if (field.kind === 'date') {
      return (
        <div class="kanban-card-editor__date-controls">
          <DateTimeField
            {...dateFieldProps}
            value={display}
            placeholder={field.placeholder}
            onValueChange={(next) => props.onValue(field, next)}
          />
        </div>
      );
    }

    const date = temporalDatePart(display);
    const time = date === display ? '' : temporalTimePart(display);
    const label = field.label ?? field.id;
    const change = (nextDate: string, nextTime: string) =>
      props.onValue(field, nextDate || nextTime ? withTemporalTime(nextDate, nextTime, 'datetime') : '');
    return (
      <div class="kanban-card-editor__date-controls">
        <DateTimeField
          {...dateFieldProps}
          kind="date"
          value={date}
          aria-labelledby={undefined}
          aria-label={`${label} ${picker.text?.date ?? 'Date'}`}
          placeholder={field.placeholder}
          onValueChange={(next) => change(next, time)}
        />
        <DateTimeField
          {...dateFieldProps}
          kind="time"
          value={time}
          aria-labelledby={undefined}
          aria-label={`${label} ${picker.text?.time ?? 'Time'}`}
          onValueChange={(next) => change(date, next)}
        />
      </div>
    );
  }
  if (field.kind === 'tags') {
    return (
      <UiInput
        {...validationAttributes}
        type="text"
        value={tagText ?? displayKanbanEditorFieldValue(value, field)}
        placeholder={field.placeholder}
        disabled={disabled}
        onInput={(event) => {
          const text = event.currentTarget.value;
          setTagText(text);
          props.onValue(field, text);
        }}
        onBlur={() => setTagText(undefined)}
      />
    );
  }
  return (
    <UiInput
      {...validationAttributes}
      type={kanbanEditorInputType(field.kind)}
      value={displayKanbanEditorFieldValue(value, field, props.dateTimeZone)}
      placeholder={field.placeholder}
      disabled={disabled}
      min={field.id === 'progress' ? 0 : undefined}
      max={field.id === 'progress' ? 100 : undefined}
      onInput={(event) => props.onValue(field, (event.currentTarget as HTMLInputElement).value)}
    />
  );
}
