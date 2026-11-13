/** @jsxImportSource preact */
import { Alert } from '@revolist/ui/controls';
import { EditableDialogHeader, DialogBody, DialogActionFooter } from '@revolist/ui/dialog/dialog.parts';

import type { DataType } from '@revolist/revogrid';
import { h } from 'preact';
import type { RefObject } from 'preact';
import type { KanbanCardEditorDialogProps } from './kanban-card-editor-dialog.props.js';
import { isKanbanEditorFieldReadonly, isKanbanEditorFieldVisible } from './kanban-card-editor-dialog.utils.js';
import type { KanbanCardEditorField } from './kanban-card-editor-dialog.types.js';
import { KanbanCardEditorFieldRow } from './kanban-card-editor-field.js';

interface KanbanCardEditorDialogHeaderProps<T extends DataType> extends KanbanCardEditorDialogProps<T> {
  readonly headerRef: RefObject<HTMLElement>;
  readonly titleId: string;
  readonly titleField?: KanbanCardEditorField<T>;
  readonly title: string;
}

export function KanbanCardEditorDialogHeader<T extends DataType>(props: KanbanCardEditorDialogHeaderProps<T>) {
  const { titleField } = props;
  return (
    <EditableDialogHeader
      ref={props.headerRef}
      class="kanban-card-editor__header"
      titleId={props.titleId}
      title={props.title || props.labels.untitledCard}
      inputLabel={titleField?.label ?? props.labels.untitledCard}
      inputProps={
        titleField
          ? {
              class: 'kanban-card-editor__title-input',
              'data-kanban-card-editor-field': 'title',
              value: props.title,
              placeholder: props.state.mode === 'create' ? props.labels.newCard : props.labels.untitledCard,
              disabled: props.state.pending || isKanbanEditorFieldReadonly(titleField, props),
              'aria-invalid': props.state.errors.title ? 'true' : undefined,
              autofocus: props.state.mode === 'create',
              onInput: (event) => props.onValue(titleField, event.currentTarget.value),
            }
          : false
      }
      closeLabel={props.labels.close}
      closeProps={{ class: 'kanban-card-editor__close' }}
      onClose={props.onClose}
    />
  );
}

export function KanbanCardEditorValidationMessage<T extends DataType>(props: KanbanCardEditorDialogProps<T>) {
  if (!Object.keys(props.state.errors).length) {
    return null;
  }
  return (
    <Alert class="kanban-card-editor__message rv-dialog__message" tone="danger">
      <strong>{props.labels.validationSummary}</strong>
      <span>{Object.values(props.state.errors)[0]}</span>
    </Alert>
  );
}

export function KanbanCardEditorDialogBody<T extends DataType>(props: KanbanCardEditorDialogProps<T>) {
  const fields = props.fields.filter((field) => field.id !== 'title' && isKanbanEditorFieldVisible(field, props));
  return (
    <DialogBody class="kanban-card-editor__body">
      <div class="kanban-card-editor__grid">
        {fields.map((field) => (
          <KanbanCardEditorFieldRow key={field.id} field={field} {...props} />
        ))}
      </div>
    </DialogBody>
  );
}

export function KanbanCardEditorDialogFooter<T extends DataType>(props: KanbanCardEditorDialogProps<T>) {
  return (
    <DialogActionFooter
      class="kanban-card-editor__footer"
      deleteAction={
        props.state.mode === 'edit'
          ? {
              label: props.labels.delete,
              'data-kanban-card-editor-action': 'delete',
              disabled: props.state.pending,
              onClick: props.onDelete,
            }
          : false
      }
      cancel={{
        label: props.labels.cancel,
        'data-kanban-card-editor-action': 'cancel',
        disabled: props.state.pending,
        onClick: props.onClose,
      }}
      save={{
        label: props.labels.save,
        'data-kanban-card-editor-action': 'save',
        disabled: props.state.pending,
      }}
    />
  );
}
