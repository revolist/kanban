import './kanban-use-case-demo.scss';
import { useEffect, useMemo, useState } from 'react';
import { RevoGrid } from '@revolist/react-datagrid';
import type { KanbanUseCaseScenario } from './kanban-use-case-model';
import { createKanbanUseCaseConfig, kanbanUseCaseShellClass, resolveKanbanUseCaseDark } from './kanban-use-case-model';
import { createKanbanUseCasePlugins } from './kanban-use-case-plugins';
import { currentTheme, observeCurrentTheme } from '../theme';

export default function KanbanUseCaseDemo({ scenario }: { scenario: KanbanUseCaseScenario }) {
  const [hostIsDark, setHostIsDark] = useState(() => currentTheme().isDark());
  const isDark = resolveKanbanUseCaseDark(scenario, hostIsDark);
  const source = useMemo(() => [...scenario.cards], [scenario]);
  const columns = useMemo(() => [...scenario.columns], [scenario]);
  const plugins = useMemo(() => createKanbanUseCasePlugins(scenario), [scenario]);
  const columnTypes = useMemo(() => ({}), []);
  const additionalData = useMemo(() => ({}), []);
  const kanban = useMemo(() => createKanbanUseCaseConfig(scenario), [scenario]);

  useEffect(() => observeCurrentTheme(setHostIsDark), []);

  return (
    <section
      className={kanbanUseCaseShellClass(scenario, hostIsDark)}
      aria-label={scenario.title}
    >
      <header className="kanban-use-case-header">
        <div className="kanban-use-case-header__main">
          <div className="kanban-use-case-identity">
            <span className="kanban-use-case-eyebrow">{scenario.eyebrow}</span>
            <strong className="kanban-use-case-title">{scenario.title}</strong>
          </div>
          <div className="kanban-use-case-metrics">
            {scenario.metrics.map((metric) => (
              <div key={metric.label} className={`kanban-use-case-metric kanban-use-case-metric--${metric.tone ?? 'neutral'}`}>
                <strong className="kanban-use-case-metric__value">{metric.value}</strong>
                <span className="kanban-use-case-metric__label">{metric.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={`kanban-use-case-status kanban-use-case-status--${scenario.attention.tone}`}>
          <span className="kanban-use-case-status__dot" aria-hidden="true" />
          <span><strong>{scenario.attention.label}:</strong> {scenario.attention.detail}</span>
        </div>
      </header>
      <RevoGrid
        className="kanban-use-case-grid"
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
    </section>
  );
}
