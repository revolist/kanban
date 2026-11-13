/** @jsxImportSource preact */
import { SvgButton } from '@revolist/ui/buttons/svg-button';

import { h } from 'preact';
import { DEFAULT_TOOLBAR_ACTIONS, type KanbanToolbarModel } from './model.js';
import type { KanbanToolbarAction, KanbanToolbarLabels, KanbanToolbarOptions } from './types.js';
import { ToolbarIcon } from './icons.js';

interface ActionProps {
  readonly model: KanbanToolbarModel;
  readonly labels: KanbanToolbarLabels;
  readonly options: KanbanToolbarOptions;
  readonly onAction: (action: string) => void;
}
export function ToolbarActions(props: ActionProps) {
  const { model, labels } = props;
  const actions = (props.options.actions ?? DEFAULT_TOOLBAR_ACTIONS).filter(
    (action) => action === 'add' || (model.selected > 0 && (action === 'edit' || action === 'delete')),
  );
  if (!actions.length && !model.selected) {
    return null;
  }
  return (
    <div class="kanban-toolbar__actions" role="group" aria-label={labels.actions}>
      {actions.map((action) => {
        const label =
          action === 'delete' && model.selected > 1
            ? labels.deleteMany(model.selected)
            : labels[action as 'add' | 'edit' | 'delete'];
        return (
          <SvgButton
            key={action}
            type="button"
            variant={action === 'add' ? 'solid' : undefined}
            className={[
              action === 'add' ? '' : action === 'delete' ? 'rv-btn-danger-outline' : 'rv-btn-ghost',
              'rv-icon-action',
              'kanban-toolbar__action',
              props.options.showLabels ? '' : 'rv-btn-icon kanban-toolbar__square',
            ]
              .filter(Boolean)
              .join(' ')}
            label={label}
            iconContent={
              <ToolbarIcon name={action as 'add' | 'edit' | 'delete'} renderIcon={props.options.renderIcon} />
            }
            visibleLabel={props.options.showLabels ? label : undefined}
            disabled={!model.enabled[action]}
            data-kanban-action={action}
            onClick={() => props.onAction(action)}
          />
        );
      })}
      {props.options.count !== false && model.selected > 0 && (
        <span class="kanban-toolbar__count" role="status">
          {labels.selection(model.selected)}
        </span>
      )}
    </div>
  );
}
