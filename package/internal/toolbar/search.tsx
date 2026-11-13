/** @jsxImportSource preact */
import { SearchInput } from '@revolist/ui/search-input/index';

import { h } from 'preact';
import { ToolbarIcon } from './icons.js';
import type { KanbanToolbarOptions } from './types.js';

export function ToolbarSearch(props: {
  readonly renderIcon?: KanbanToolbarOptions['renderIcon'];
  readonly label: string;
  readonly disabled: boolean;
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  return (
    <SearchInput
      rootClassName="kanban-toolbar__search"
      aria-label={props.label}
      placeholder={props.label}
      disabled={props.disabled}
      value={props.value}
      onValueChange={props.onChange}
      icon={<ToolbarIcon name="search" renderIcon={props.renderIcon} />}
      shortcut={
        <kbd>{typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ K' : 'Ctrl K'}</kbd>
      }
    />
  );
}
