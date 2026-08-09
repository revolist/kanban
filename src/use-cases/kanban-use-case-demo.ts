import './kanban-use-case-demo.scss';
import { defineCustomElements } from '@revolist/revogrid/loader';
import type { KanbanUseCaseMetric, KanbanUseCaseScenario } from './kanban-use-case-model';
import { createKanbanUseCaseConfig, kanbanUseCaseShellClass, resolveKanbanUseCaseDark } from './kanban-use-case-model';
import { createKanbanUseCasePlugins } from './kanban-use-case-plugins';
import { currentTheme, observeCurrentTheme } from '../theme';

defineCustomElements();

function appendTextElement(parent: HTMLElement, tag: string, className: string, value: string): HTMLElement {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = value;
  parent.appendChild(element);
  return element;
}

function appendMetric(parent: HTMLElement, metric: KanbanUseCaseMetric): void {
  const card = document.createElement('div');
  card.className = `kanban-use-case-metric kanban-use-case-metric--${metric.tone ?? 'neutral'}`;
  appendTextElement(card, 'strong', 'kanban-use-case-metric__value', metric.value);
  appendTextElement(card, 'span', 'kanban-use-case-metric__label', metric.label);
  parent.appendChild(card);
}

function createHeader(scenario: KanbanUseCaseScenario): HTMLElement {
  const header = document.createElement('header');
  header.className = 'kanban-use-case-header';
  const main = document.createElement('div');
  main.className = 'kanban-use-case-header__main';
  const identity = document.createElement('div');
  identity.className = 'kanban-use-case-identity';
  const metrics = document.createElement('div');
  metrics.className = 'kanban-use-case-metrics';

  appendTextElement(identity, 'span', 'kanban-use-case-eyebrow', scenario.eyebrow);
  appendTextElement(identity, 'strong', 'kanban-use-case-title', scenario.title);

  const status = document.createElement('div');
  status.className = `kanban-use-case-status kanban-use-case-status--${scenario.attention.tone}`;
  const dot = document.createElement('span');
  dot.className = 'kanban-use-case-status__dot';
  dot.setAttribute('aria-hidden', 'true');
  status.appendChild(dot);
  const message = document.createElement('span');
  const label = document.createElement('strong');
  label.textContent = `${scenario.attention.label}: `;
  message.append(label, document.createTextNode(scenario.attention.detail));
  status.appendChild(message);
  scenario.metrics.forEach((metric) => appendMetric(metrics, metric));
  main.append(identity, metrics);
  header.append(main, status);
  return header;
}

export function mountKanbanUseCase(parentSelector: string, scenario: KanbanUseCaseScenario): (() => void) | undefined {
  const parent = document.querySelector(parentSelector);
  if (!parent) return;

  let hostIsDark = currentTheme().isDark();
  const isDark = resolveKanbanUseCaseDark(scenario, hostIsDark);
  const shell = document.createElement('section');
  shell.className = kanbanUseCaseShellClass(scenario, hostIsDark);
  shell.setAttribute('aria-label', scenario.title);
  shell.appendChild(createHeader(scenario));

  const grid = document.createElement('revo-grid') as HTMLRevoGridElement;
  grid.className = 'kanban-use-case-grid';
  grid.hideAttribution = true;
  grid.resize = true;
  grid.columns = [...scenario.columns];
  grid.plugins = createKanbanUseCasePlugins(scenario);
  grid.theme = isDark ? 'darkCompact' : 'compact';
  grid.kanban = createKanbanUseCaseConfig(scenario) as typeof grid.kanban;
  shell.appendChild(grid);
  parent.appendChild(shell);
  grid.source = [...scenario.cards];

  const disconnectTheme = observeCurrentTheme((dark) => {
    hostIsDark = dark;
    const nextIsDark = resolveKanbanUseCaseDark(scenario, hostIsDark);
    grid.theme = nextIsDark ? 'darkCompact' : 'compact';
    shell.className = kanbanUseCaseShellClass(scenario, hostIsDark);
  });

  return () => {
    disconnectTheme();
    shell.remove();
  };
}
