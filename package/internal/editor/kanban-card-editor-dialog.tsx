/** @jsxImportSource preact */
import { DialogForm } from '@revolist/ui/dialog/dialog.parts';
import type { DataType } from '@revolist/revogrid';
import { h } from 'preact';
import { useEffect, useId, useRef } from '@revolist/ui/preact-mount';
import { useDialogDrag } from '@revolist/ui/dialog/dialog.preact';
import {
  KanbanCardEditorDialogBody,
  KanbanCardEditorDialogFooter,
  KanbanCardEditorDialogHeader,
  KanbanCardEditorValidationMessage,
} from './kanban-card-editor-dialog.layout.js';
import type { KanbanCardEditorDialogProps } from './kanban-card-editor-dialog.props.js';
import { displayKanbanEditorFieldValue, readKanbanEditorFieldValue } from './kanban-card-editor-dialog.utils.js';

export type { KanbanCardEditorDialogProps } from './kanban-card-editor-dialog.props.js';

export function KanbanCardEditorDialog<T extends DataType>(props: KanbanCardEditorDialogProps<T>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const titleId = useId();
  const titleField = props.fields.find(({ id }) => id === 'title');
  const title = titleField
    ? displayKanbanEditorFieldValue(readKanbanEditorFieldValue(titleField, props), titleField)
    : '';

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (!dialog.open) {
      typeof dialog.showModal === 'function' ? dialog.showModal() : dialog.setAttribute('open', '');
    }
    return () => {
      if (dialog.open) {
        dialog.close();
      }
    };
  }, [props.state.card, props.state.mode]);
  useDialogDrag({ targetRef: dialogRef, handleRef: headerRef, enabled: true });

  return (
    <dialog
      ref={dialogRef}
      class="kanban-card-editor rv-dialog"
      data-kanban-card-editor=""
      aria-labelledby={titleId}
      aria-busy={props.state.pending ? 'true' : 'false'}
      onCancel={(event) => {
        event.preventDefault();
        props.onClose();
      }}
    >
      <DialogForm
        class="kanban-card-editor__surface"
        onSubmit={(event) => {
          event.preventDefault();
          props.onSubmit();
        }}
      >
        <KanbanCardEditorDialogHeader
          {...props}
          headerRef={headerRef}
          titleId={titleId}
          titleField={titleField}
          title={title}
        />
        <KanbanCardEditorValidationMessage {...props} />
        <KanbanCardEditorDialogBody {...props} />
        <KanbanCardEditorDialogFooter {...props} />
      </DialogForm>
    </dialog>
  );
}
