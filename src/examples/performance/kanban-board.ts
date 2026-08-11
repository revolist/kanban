import { defineCustomElements } from '@revolist/revogrid/loader';
import { KanbanCardEditorDialogPlugin, KanbanPlugin } from '@revolist/kanban';
import { currentTheme, observeCurrentTheme } from '../../theme';
import { createKanbanBoardConfig, createKanbanBoardEditor, KANBAN_BOARD_COLUMNS, resolveKanbanBoardRows, type KanbanBoardCard } from './kanban-board-data';
import './kanban-board.scss';

defineCustomElements();

export function load(parentSelector: string, rows?: KanbanBoardCard[]) {
  const parent = document.querySelector(parentSelector);
  if (!parent) return;
  const wrapper = document.createElement('div');
  wrapper.className = 'kanban-board';
  const grid = document.createElement('revo-grid');
  grid.className = 'kanban-board__grid';
  grid.hideAttribution = true;
  grid.resize = true;
  grid.columns = KANBAN_BOARD_COLUMNS;
  grid.plugins = [KanbanPlugin, KanbanCardEditorDialogPlugin];
  grid.theme = currentTheme().isDark() ? 'darkCompact' : 'compact';
  grid.kanban = createKanbanBoardConfig();
  grid.kanbanCardEditorDialog = createKanbanBoardEditor();
  wrapper.append(grid);
  parent.append(wrapper);
  grid.source = resolveKanbanBoardRows(rows);
  const disconnectTheme = observeCurrentTheme((isDark) => {
    grid.theme = isDark ? 'darkCompact' : 'compact';
  });
  return () => { disconnectTheme(); grid.remove(); wrapper.remove(); };
}
