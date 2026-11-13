/** @jsxImportSource preact */
import { h, Fragment } from 'preact';
import { SegmentedSwitch } from '@revolist/ui/segmented-switch/index';
import { ToolbarIcon } from './icons.js';
import type { KanbanToolbarViewProps } from './view-props.js';

export function ToolbarViewSwitcher({ model, labels, options, canSwitch, onView }: KanbanToolbarViewProps) {
  if (options.viewSwitcher === false) {
    return null;
  }
  return (
    <SegmentedSwitch<'board' | 'table'>
      className="kanban-toolbar__views"
      role="group"
      iconOnly={!options.showLabels}
      value={model.active ? 'board' : 'table'}
      ariaLabel={labels.views}
      title={model.pending ? labels.pending : undefined}
      disabled={!canSwitch || model.pending}
      options={[
        {
          value: 'board',
          label: labels.board,
          ariaLabel: labels.board,
          title: labels.board,
        },
        {
          value: 'table',
          label: labels.table,
          ariaLabel: labels.table,
          title: labels.table,
        },
      ]}
      renderOption={(option) => (
        <>
          <ToolbarIcon name={option.value} renderIcon={options.renderIcon} />
          {options.showLabels && <span>{option.label}</span>}
        </>
      )}
      onChange={(value) => onView(value === 'board')}
    />
  );
}
