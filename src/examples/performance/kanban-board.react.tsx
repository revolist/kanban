import { useEffect, useMemo, useState } from 'react';
import { RevoGrid } from '@revolist/react-datagrid';
import { KanbanCardEditorDialogPlugin, KanbanPlugin } from '@revolist/kanban';
import { currentTheme, observeCurrentTheme } from '../../theme';
import { createKanbanBoardConfig, createKanbanBoardEditor, KANBAN_BOARD_COLUMNS, resolveKanbanBoardRows, type KanbanBoardCard } from './kanban-board-data';
import './kanban-board.scss';

export default function KanbanBoard({ rows }: { rows?: KanbanBoardCard[] }) {
  const [isDark, setIsDark] = useState(() => currentTheme().isDark());
  const source = useMemo(() => resolveKanbanBoardRows(rows), [rows]);
  const columns = useMemo(() => KANBAN_BOARD_COLUMNS, []);
  const plugins = useMemo(() => [KanbanPlugin, KanbanCardEditorDialogPlugin], []);
  const columnTypes = useMemo(() => ({}), []);
  const additionalData = useMemo(() => ({}), []);
  const kanban = useMemo(() => createKanbanBoardConfig(), []);
  const editor = useMemo(() => createKanbanBoardEditor(), []);
  useEffect(() => observeCurrentTheme(setIsDark), []);
  return <div className="kanban-board">
    <RevoGrid className="kanban-board__grid" hideAttribution resize source={source} columns={columns} plugins={plugins} columnTypes={columnTypes} additionalData={additionalData} kanban={kanban} kanbanCardEditorDialog={editor} theme={isDark ? 'darkCompact' : 'compact'} />
  </div>;
}
