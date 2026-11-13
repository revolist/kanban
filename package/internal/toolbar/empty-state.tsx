/** @jsxImportSource preact */
import { ButtonControl as UiButton } from '@revolist/ui/native-control';

import { h } from 'preact';
import { ToolbarIcon } from './icons.js';
import type { KanbanToolbarViewProps } from './view-props.js';

export function ToolbarEmptyState({ model, labels, options, onAction }: KanbanToolbarViewProps) {
  if (options.emptyState === false || !model.active || model.total !== 0) {
    return null;
  }
  const canShowAdd = !options.actions || options.actions.includes('add');
  return (
    <div class="kanban-toolbar__empty">
      <span>{labels.empty}</span>
      {canShowAdd && (
        <UiButton
          type="button"
          class={`rv-btn${options.showLabels ? '' : ' kanban-toolbar__square'}`}
          aria-label={labels.createFirst}
          title={labels.createFirst}
          disabled={!model.enabled.add}
          onClick={() => onAction('add')}
        >
          <ToolbarIcon name="add" renderIcon={options.renderIcon} />
          {options.showLabels && <span>{labels.createFirst}</span>}
        </UiButton>
      )}
    </div>
  );
}
