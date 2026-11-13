/** @jsxImportSource preact */
import { ButtonControl as UiButton, Select as UiSelect } from '@revolist/ui/native-control';

import { h } from 'preact';
import { ToolbarIcon } from './icons.js';
import { filterValueKey, toolbarFilterOptions } from './filters.js';
import type { KanbanToolbarViewProps } from './view-props.js';

export function ToolbarFilterPanel(props: KanbanToolbarViewProps) {
  return (
    <section
      class="kanban-toolbar-popover"
      id={props.popover.id}
      ref={props.popover.panelRef}
      role="dialog"
      aria-label={props.labels.filters}
    >
      <div class="kanban-toolbar-popover__heading">
        <h3>{props.labels.filters}</h3>
        <UiButton
          type="button"
          class="rv-btn-ghost kanban-toolbar__square"
          aria-label={props.labels.closeFilters}
          title={props.labels.closeFilters}
          onClick={() => props.popover.close()}
        >
          <ToolbarIcon name="close" renderIcon={props.options.renderIcon} />
        </UiButton>
      </div>
      <div class="kanban-toolbar-popover__fields">
        {props.filters.map((filter) => (
          <label key={filter.id} class="kanban-toolbar-popover__field">
            <span>{filter.label}</span>
            <UiSelect
              aria-label={filter.label}
              disabled={!props.model.active}
              value={
                props.filterState.selected.has(filter.id)
                  ? filterValueKey(props.filterState.selected.get(filter.id)!)
                  : ''
              }
              onValueChange={(event) => props.onFilter(filter.id, event)}
            >
              <option value="">{props.labels.all}</option>
              {toolbarFilterOptions(filter, props.cards).map((option) => (
                <option key={filterValueKey(option.value)} value={filterValueKey(option.value)}>
                  {option.label}
                </option>
              ))}
            </UiSelect>
          </label>
        ))}
      </div>
      <div class="kanban-toolbar-popover__footer">
        <UiButton type="button" class="rv-btn-ghost" disabled={!props.filterState.active} onClick={props.onClear}>
          {props.labels.clear}
        </UiButton>
        <UiButton type="button" class="rv-btn" onClick={() => props.popover.close()}>
          {props.labels.done}
        </UiButton>
      </div>
    </section>
  );
}
