import { defineCustomElements } from '@revolist/revogrid/loader';
import { KanbanPlugin } from '@revolist/kanban';
import { currentTheme, observeCurrentTheme } from '../../theme';
import {
  createKanbanServerConfig,
  KANBAN_SERVER_COLUMNS,
  type ServerCard,
} from './kanban-server-loading.shared';
import './kanban-server-loading.scss';

defineCustomElements();

export function load(parentSelector: string, rows: ServerCard[] = []) {
  const parent = document.querySelector(parentSelector);
  if (!parent) return;

  const wrapper = document.createElement('section');
  wrapper.className = 'kanban-server-loading';
  const notification = document.createElement('p');
  notification.className = 'kanban-server-loading__notice';
  notification.role = 'status';
  notification.ariaLive = 'polite';
  notification.textContent = 'Waiting for server…';

  const grid = document.createElement('revo-grid');
  grid.className = 'kanban-server-loading__grid';
  grid.hideAttribution = true;
  grid.resize = true;
  grid.columns = KANBAN_SERVER_COLUMNS;
  grid.plugins = [KanbanPlugin];
  grid.theme = currentTheme().isDark() ? 'darkCompact' : 'compact';
  grid.kanban = createKanbanServerConfig((message) => {
    notification.textContent = message;
  });

  wrapper.append(notification, grid);
  parent.append(wrapper);
  grid.source = rows;

  const disconnectTheme = observeCurrentTheme((isDark) => {
    wrapper.classList.toggle('kanban-server-loading--dark', isDark);
    grid.theme = isDark ? 'darkCompact' : 'compact';
  });
  return () => {
    disconnectTheme();
    grid.remove();
    wrapper.remove();
  };
}
