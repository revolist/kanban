/** @jsxImportSource preact */
import { Alert } from '@revolist/ui/controls';
import { ButtonControl as UiButton } from '@revolist/ui/native-control';

import { h } from 'preact';
import { ToolbarViewSwitcher } from './view-switcher.js';
import { ToolbarEmptyState } from './empty-state.js';
import { ToolbarIcon } from './icons.js';
import { ToolbarActions } from './actions.js';
import { ToolbarSearch } from './search.js';
import { ToolbarFilterPanel } from './filter-panel.js';
import type { KanbanToolbarViewProps } from './view-props.js';
export type { KanbanToolbarViewProps } from './view-props.js';

export function KanbanToolbarView(
  props: KanbanToolbarViewProps & { extraActions?: import('preact').ComponentChildren; role?: 'region' | 'toolbar' },
) {
  const { model, labels, options, filterState } = props;
  const stop = (event: Event) => event.stopPropagation();
  const keydown = (event: KeyboardEvent) => {
    if (
      (event.metaKey || event.ctrlKey) &&
      event.key.toLowerCase() === 'k' &&
      model.active &&
      options.search !== false
    ) {
      event.preventDefault();
      (event.currentTarget as HTMLElement).querySelector<HTMLInputElement>('input[type="search"]')?.focus();
    }
    event.stopPropagation();
  };
  return (
    <section
      class={`kanban-toolbar ${options.className ?? ''}`.trim()}
      role={props.role ?? 'region'}
      aria-label={labels.toolbar}
      onKeyDown={keydown}
      onKeyUp={stop}
      onPointerDown={stop}
      onClick={stop}
    >
      <div class="kanban-toolbar__main">
        {options.renderStart?.(model)}
        <ToolbarActions {...props} />
        {options.count !== false && model.active && model.selected === 0 && (
          <span class="kanban-toolbar__count" role="status">
            {labels.count(model.visible, model.total)}
          </span>
        )}
        <div class="kanban-toolbar__tools">
          {options.search !== false && (
            <ToolbarSearch
              renderIcon={options.renderIcon}
              label={labels.search}
              disabled={!model.active}
              value={filterState.query}
              onChange={props.onSearch}
            />
          )}
          {props.filters.length > 0 && (
            <UiButton
              type="button"
              class={[
                'rv-btn-ghost',
                options.showLabels ? '' : 'kanban-toolbar__square',
                'kanban-toolbar__filter-toggle',
                filterState.selected.size ? 'kanban-toolbar__filter-toggle--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              ref={props.popover.buttonRef}
              aria-label={labels.filters}
              title={labels.filters}
              disabled={!model.active}
              aria-haspopup="dialog"
              aria-controls={props.popover.id}
              aria-expanded={props.popover.open}
              onClick={() => props.popover.toggle()}
            >
              <ToolbarIcon name="filters" renderIcon={options.renderIcon} />
              {options.showLabels && <span>{labels.filters}</span>}
              {filterState.selected.size > 0 && (
                <span class="kanban-toolbar__filter-count">{filterState.selected.size}</span>
              )}
            </UiButton>
          )}
        </div>
        {props.extraActions}
        <ToolbarViewSwitcher {...props} />
        {options.renderEnd?.(model)}
      </div>
      {props.filters.length > 0 && <ToolbarFilterPanel {...props} />}
      {model.pending && <Alert class="kanban-toolbar__pending">{labels.pending}</Alert>}
      <ToolbarEmptyState {...props} />
    </section>
  );
}
