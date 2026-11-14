import { useEffect, useMemo, useRef, useState } from 'react';
import { RevoGrid } from '@revolist/react-datagrid';
import { currentTheme, observeCurrentTheme } from '../../theme';
import { createCommunitySession, communityLanguage, type CommunityCard } from './community.shared';
export default function CommunityBoard({ rows }: { rows?: CommunityCard[] }) {
  const session = useMemo(() => createCommunitySession(rows, communityLanguage()), [rows]);
  const grid = useRef<HTMLRevoGridElement>(null);
  const [status, setStatus] = useState(session.labels.initial);
  const [dark, setDark] = useState(() => currentTheme().isDark());
  useEffect(() => observeCurrentTheme(setDark), []);
  return (
    <section className="community-demo rv-native-controls" data-theme="auto">
      <header>
        <div>
          <h1>{session.labels.title}</h1>
          <p>{session.labels.intro}</p>
        </div>
        <div className="community-demo__actions">
          <button
            className="rv-btn-solid"
            onClick={async () => setStatus((await session.save(grid.current)) ?? status)}
          >
            {session.labels.save}
          </button>
          <button className="rv-btn-ghost" onClick={() => setStatus(session.load(grid.current) ?? status)}>
            {session.labels.load}
          </button>
        </div>
      </header>
      <p className="community-demo__status" role="status">
        {status}
      </p>
      <RevoGrid
        ref={grid}
        className="community-demo__grid"
        source={session.source}
        plugins={session.plugins}
        kanban={session.config}
        kanbanToolbar={session.toolbar}
        theme={dark ? 'darkCompact' : 'compact'}
      />
    </section>
  );
}
