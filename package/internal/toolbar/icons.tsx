/** @jsxImportSource preact */
import { SvgIcon } from '@revolist/ui/icons/icon';
import { h } from 'preact';
import type { KanbanToolbarIcon, KanbanToolbarOptions } from './types.js';
import plus from '@fortawesome/fontawesome-free/svgs/solid/plus.svg?raw';
import edit from '@fortawesome/fontawesome-free/svgs/solid/pencil.svg?raw';
import remove from '@fortawesome/fontawesome-free/svgs/regular/trash-can.svg?raw';
import search from '@fortawesome/fontawesome-free/svgs/solid/magnifying-glass.svg?raw';
import filters from '@fortawesome/fontawesome-free/svgs/solid/sliders.svg?raw';
import board from '@fortawesome/fontawesome-free/svgs/solid/table-columns.svg?raw';
import table from '@fortawesome/fontawesome-free/svgs/solid/table-list.svg?raw';
import close from '@fortawesome/fontawesome-free/svgs/solid/xmark.svg?raw';

const icons = {
  add: plus,
  edit,
  delete: remove,
  search,
  filters,
  board,
  table,
  close,
};
export function ToolbarIcon({
  name,
  renderIcon,
}: {
  name: KanbanToolbarIcon;
  renderIcon?: KanbanToolbarOptions['renderIcon'];
}) {
  if (renderIcon) {
    return (
      <span class="kanban-toolbar__icon" aria-hidden="true">
        {renderIcon(name)}
      </span>
    );
  }
  return <SvgIcon className="kanban-toolbar__icon" svg={icons[name]} />;
}
