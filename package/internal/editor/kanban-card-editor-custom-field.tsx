/** @jsxImportSource preact */
import type { DataType } from '@revolist/revogrid';
import { h } from 'preact';
import { useEffect, useRef } from '@revolist/ui/preact-mount';
import type { KanbanCardEditorFieldProps } from './kanban-card-editor-dialog.props.js';
import { createKanbanEditorFieldContext } from './kanban-card-editor-dialog.utils.js';
import type { KanbanCardEditorFieldRendererLifecycle } from './kanban-card-editor-dialog.types.js';

export interface KanbanCardEditorCustomFieldProps<T extends DataType = DataType> extends KanbanCardEditorFieldProps<T> {
  readonly value: unknown;
  readonly disabled: boolean;
}

export function KanbanCardEditorCustomField<T extends DataType>(props: KanbanCardEditorCustomFieldProps<T>) {
  const hostRef = useRef<HTMLDivElement>(null);
  const lifecycle = useRef<KanbanCardEditorFieldRendererLifecycle<T>>();
  const context = {
    ...createKanbanEditorFieldContext(props.field, props),
    value: props.value,
    error: props.state.errors[props.field.id],
    disabled: props.disabled,
    setValue: (value: unknown) => props.onValue(props.field, value),
  };

  useEffect(() => {
    if (!hostRef.current || !props.field.renderer) {
      return;
    }
    const mountedLifecycle = props.field.renderer.mount(hostRef.current, context) ?? undefined;
    lifecycle.current = mountedLifecycle;
    return () => {
      mountedLifecycle?.destroy?.();
      if (lifecycle.current === mountedLifecycle) {
        lifecycle.current = undefined;
      }
    };
  }, [props.field.renderer]);

  useEffect(() => lifecycle.current?.update?.(context));

  return <div ref={hostRef} class="kanban-card-editor__custom-field" />;
}
