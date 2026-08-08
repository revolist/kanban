import { useEffect, useMemo, useRef, useState } from 'react';
import { RevoGrid } from '@revolist/react-datagrid';
import { KanbanPlugin } from '@revolist/revogrid-enterprise';
import { currentTheme, observeCurrentTheme } from '../../theme';
import {
  createKanbanServerConfig,
  KANBAN_SERVER_COLUMNS,
  type ServerCard,
} from './kanban-server-loading.shared';
import './kanban-server-loading.scss';

export default function KanbanServerLoading({ rows }: { rows?: ServerCard[] }) {
  const notification = useRef<HTMLParagraphElement>(null);
  const [isDark, setIsDark] = useState(() => currentTheme().isDark());
  const source = useMemo(() => rows ?? [], [rows]);
  const columns = useMemo(() => KANBAN_SERVER_COLUMNS, []);
  const plugins = useMemo(() => [KanbanPlugin], []);
  const columnTypes = useMemo(() => ({}), []);
  const additionalData = useMemo(() => ({}), []);
  const kanban = useMemo(() => createKanbanServerConfig((message) => {
    if (notification.current) notification.current.textContent = message;
  }), []);

  useEffect(() => observeCurrentTheme(setIsDark), []);

  return <section className={`kanban-server-loading${isDark ? ' kanban-server-loading--dark' : ''}`}>
    <p ref={notification} className="kanban-server-loading__notice" role="status" aria-live="polite">
      Waiting for server…
    </p>
    <RevoGrid
      className="kanban-server-loading__grid"
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
  </section>;
}
