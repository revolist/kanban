import { useEffect, useMemo, useState } from 'react';
import { RevoGrid } from '@revolist/react-datagrid';
import { KanbanPlugin } from '@revolist/revogrid-enterprise';
import { currentTheme, observeCurrentTheme } from '../../theme';
import { createKanbanShowcaseConfig, KANBAN_SHOWCASE_COLUMNS, resolveKanbanRows, type KanbanShowcaseCard } from './kanban.shared';
import './kanban.scss';

export default function KanbanShowcase({ rows }: { rows?: KanbanShowcaseCard[] }) {
  const [isDark, setIsDark] = useState(() => currentTheme().isDark());
  const source = useMemo(() => resolveKanbanRows(rows), [rows]);
  const columns = useMemo(() => KANBAN_SHOWCASE_COLUMNS, []);
  const plugins = useMemo(() => [KanbanPlugin], []);
  const columnTypes = useMemo(() => ({}), []);
  const additionalData = useMemo(() => ({}), []);
  const kanban = useMemo(() => createKanbanShowcaseConfig(), []);

  useEffect(() => observeCurrentTheme(setIsDark), []);

  return (
    <div className="kanban-showcase">
      <RevoGrid
        className="kanban-showcase__grid"
        hideAttribution
        resize
        source={source}
        columns={columns}
        plugins={plugins}
        columnTypes={columnTypes}
        additionalData={additionalData}
        kanban={kanban}
        theme={isDark ? 'darkCompact' : 'compact'}
      />
    </div>
  );
}
