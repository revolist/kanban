/** @jsxImportSource preact */
import type { DataType } from '@revolist/revogrid';
import { h } from 'preact';
import { useId } from '@revolist/ui/preact-mount';
import type { KanbanCardEditorFieldProps } from './kanban-card-editor-dialog.props.js';
import {
  createKanbanEditorFieldContext,
  isKanbanEditorFieldReadonly,
  readKanbanEditorFieldValue,
} from './kanban-card-editor-dialog.utils.js';
import { KanbanCardEditorFieldControl } from './kanban-card-editor-field-control.js';

export function KanbanCardEditorFieldRow<T extends DataType>(props: KanbanCardEditorFieldProps<T>) {
  const { field } = props;
  const generatedErrorId = useId();
  const generatedLabelId = useId();
  const error = props.state.errors[field.id];
  const errorId = error ? generatedErrorId : undefined;
  const value = readKanbanEditorFieldValue(field, props);
  const context = createKanbanEditorFieldContext(field, props);
  const disabled = props.state.pending || isKanbanEditorFieldReadonly(field, props);
  const options = typeof field.options === 'function' ? field.options(context) : (field.options ?? []);
  const className = `kanban-card-editor__row${field.fullWidth ? ' kanban-card-editor__row--full' : ''}`;

  return (
    <section class={className} data-kanban-card-editor-row={field.id}>
      <div class="kanban-card-editor__field">
        <span class="kanban-card-editor__label" id={generatedLabelId}>
          {field.label ?? field.id}
          {field.required ? <em aria-hidden="true"> *</em> : null}
        </span>
        {field.icon && (
          <span
            class="kanban-card-editor__row-icon"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: field.icon }}
          />
        )}
        <KanbanCardEditorFieldControl
          {...props}
          value={value}
          disabled={disabled}
          options={options}
          error={error}
          errorId={errorId}
          labelId={generatedLabelId}
        />
        {error ? (
          <small id={errorId} class="kanban-card-editor__error">
            {error}
          </small>
        ) : null}
      </div>
    </section>
  );
}
