import type { ColumnRegular, DataType } from '@revolist/revogrid';
import type { KanbanConfig } from '@revolist/kanban';
import { avatarTemplate } from '@revolist/revogrid-pro';
import arrowRightIcon from '@fortawesome/fontawesome-free/svgs/solid/arrow-right.svg?raw';
import arrowsLeftRightIcon from '@fortawesome/fontawesome-free/svgs/solid/arrows-left-right.svg?raw';
import buildingIcon from '@fortawesome/fontawesome-free/svgs/regular/building.svg?raw';
import calendarIcon from '@fortawesome/fontawesome-free/svgs/regular/calendar.svg?raw';
import chartLineIcon from '@fortawesome/fontawesome-free/svgs/solid/chart-line.svg?raw';
import chevronDownIcon from '@fortawesome/fontawesome-free/svgs/solid/chevron-down.svg?raw';
import checkCircleIcon from '@fortawesome/fontawesome-free/svgs/regular/circle-check.svg?raw';
import clipboardListIcon from '@fortawesome/fontawesome-free/svgs/solid/clipboard-list.svg?raw';
import compassIcon from '@fortawesome/fontawesome-free/svgs/regular/compass.svg?raw';
import fileCirclePlusIcon from '@fortawesome/fontawesome-free/svgs/solid/file-circle-plus.svg?raw';
import gearsIcon from '@fortawesome/fontawesome-free/svgs/solid/gears.svg?raw';
import gemIcon from '@fortawesome/fontawesome-free/svgs/regular/gem.svg?raw';
import lightbulbIcon from '@fortawesome/fontawesome-free/svgs/regular/lightbulb.svg?raw';
import lockIcon from '@fortawesome/fontawesome-free/svgs/solid/lock.svg?raw';
import magnifyingGlassIcon from '@fortawesome/fontawesome-free/svgs/solid/magnifying-glass.svg?raw';
import messageIcon from '@fortawesome/fontawesome-free/svgs/regular/message.svg?raw';
import penNibIcon from '@fortawesome/fontawesome-free/svgs/solid/pen-nib.svg?raw';
import penToSquareIcon from '@fortawesome/fontawesome-free/svgs/regular/pen-to-square.svg?raw';
import rocketIcon from '@fortawesome/fontawesome-free/svgs/solid/rocket.svg?raw';
import scaleBalancedIcon from '@fortawesome/fontawesome-free/svgs/solid/scale-balanced.svg?raw';
import screwdriverWrenchIcon from '@fortawesome/fontawesome-free/svgs/solid/screwdriver-wrench.svg?raw';
import shieldHalvedIcon from '@fortawesome/fontawesome-free/svgs/solid/shield-halved.svg?raw';
import triangleExclamationIcon from '@fortawesome/fontawesome-free/svgs/solid/triangle-exclamation.svg?raw';
import userIcon from '@fortawesome/fontawesome-free/svgs/regular/user.svg?raw';
import waveSquareIcon from '@fortawesome/fontawesome-free/svgs/solid/wave-square.svg?raw';

export type KanbanUseCaseTone = 'neutral' | 'good' | 'attention' | 'risk';
export type KanbanUseCasePriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type KanbanUseCaseCardPresentation =
  | 'delivery'
  | 'support-ticket'
  | 'revenue-opportunity'
  | 'editorial-approval'
  | 'quality-inspection'
  | 'internal-request';

const FONT_AWESOME_ICONS = {
  'arrow-right': arrowRightIcon,
  'arrows-left-right': arrowsLeftRightIcon,
  building: buildingIcon,
  calendar: calendarIcon,
  'chart-line-up': chartLineIcon,
  'chevron-down': chevronDownIcon,
  'check-circle': checkCircleIcon,
  'clipboard-list': clipboardListIcon,
  compass: compassIcon,
  'file-circle-plus': fileCirclePlusIcon,
  gears: gearsIcon,
  gem: gemIcon,
  lightbulb: lightbulbIcon,
  lock: lockIcon,
  'magnifying-glass': magnifyingGlassIcon,
  message: messageIcon,
  'pen-nib': penNibIcon,
  'pen-to-square': penToSquareIcon,
  rocket: rocketIcon,
  'scale-balanced': scaleBalancedIcon,
  'screwdriver-wrench': screwdriverWrenchIcon,
  'shield-halved': shieldHalvedIcon,
  'triangle-exclamation': triangleExclamationIcon,
  user: userIcon,
  'wave-square': waveSquareIcon,
} as const;

export type KanbanUseCaseIconName = keyof typeof FONT_AWESOME_ICONS;

export type KanbanUseCaseCard = DataType & {
  id: string;
  title: string;
  description: string;
  status: string;
  lane: string;
  owner: string;
  assignees: string[];
  priority: KanbanUseCasePriority;
  label: string;
  progress?: number;
  dueDate: string;
  order: number;
  context?: string;
  risk?: string;
} & Record<string, unknown>;

export interface KanbanUseCaseMetric {
  readonly label: string;
  readonly value: string;
  readonly tone?: KanbanUseCaseTone;
}

export interface KanbanUseCaseAttention {
  readonly label: string;
  readonly detail: string;
  readonly tone: KanbanUseCaseTone;
}

export interface KanbanUseCaseLayout {
  readonly cardRowHeight: number;
  readonly swimlaneWidth: number;
  readonly collapsedSwimlaneWidth: number;
}

export interface KanbanUseCaseScenario {
  readonly id: string;
  readonly cardPresentation: KanbanUseCaseCardPresentation;
  readonly headerIcons?: Readonly<Record<string, KanbanUseCaseIconName>>;
  readonly useSwimlanes: boolean;
  readonly swimlaneLayout?: 'column' | 'top';
  readonly showDropTargets?: boolean;
  readonly allowColumnMove?: boolean;
  readonly colorScheme?: 'light' | 'dark' | 'adaptive';
  readonly layout: KanbanUseCaseLayout;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly attention: KanbanUseCaseAttention;
  readonly metrics: readonly KanbanUseCaseMetric[];
  readonly cards: readonly KanbanUseCaseCard[];
  readonly columns: readonly ColumnRegular[];
  readonly workflowColumns: NonNullable<KanbanConfig<KanbanUseCaseCard>['columns']>;
  readonly swimlanes: NonNullable<KanbanConfig<KanbanUseCaseCard>['swimlanes']>;
  readonly wipBehavior?: NonNullable<KanbanConfig<KanbanUseCaseCard>['wipBehavior']>;
}

export function resolveKanbanUseCaseDark(
  scenario: KanbanUseCaseScenario,
  hostIsDark: boolean,
): boolean {
  if (scenario.colorScheme === 'dark') return true;
  if (scenario.colorScheme === 'light') return false;
  return hostIsDark;
}

export function kanbanUseCaseShellClass(
  scenario: KanbanUseCaseScenario,
  hostIsDark: boolean,
): string {
  const mode = resolveKanbanUseCaseDark(scenario, hostIsDark) ? 'dark' : 'light';
  const dropTargets = scenario.showDropTargets ? 'show' : 'hide';
  return `kanban-use-case-shell kanban-use-case-shell--${mode} kanban-use-case-shell--${scenario.id} kanban-use-case-shell--${dropTargets}-drop-targets`;
}

const PRIORITY_TONE: Record<KanbanUseCasePriority, string> = {
  Critical: 'critical',
  High: 'high',
  Medium: 'attention',
  Low: 'calm',
};

type HyperScript = Parameters<typeof avatarTemplate>[0];

export function kanbanUseCaseUsesProgress(
  presentation: KanbanUseCaseCardPresentation,
): boolean {
  return presentation === 'delivery';
}

export function kanbanUseCaseCardUsesProgress(
  presentation: KanbanUseCaseCardPresentation,
  status: string,
): boolean {
  return presentation === 'delivery' && status === 'build';
}

function modifier(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function cardRootClass(
  presentation: KanbanUseCaseCardPresentation,
  card: KanbanUseCaseCard,
): string {
  return [
    'kanban-use-case-card-content',
    `kanban-use-case-card-content--${presentation}`,
    `kanban-use-case-card-content--stage-${modifier(card.status)}`,
    card.severity ? `kanban-use-case-card-content--severity-${modifier(String(card.severity))}` : '',
    card.risk ? 'kanban-use-case-card-content--risk' : '',
  ].filter(Boolean).join(' ');
}

function cardValue(card: KanbanUseCaseCard, key: string, fallback = '—'): string {
  const value = card[key];
  return value === undefined || value === null || value === '' ? fallback : String(value);
}

function compactDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const month = Number(match[2]);
  const day = Number(match[3]);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[month - 1] ?? match[2]} ${day}`;
}

function monogram(value: string): string {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || '·';
}

function priorityBadge(h: HyperScript, card: KanbanUseCaseCard) {
  return h('span', {
    class: `kanban-use-case-priority kanban-use-case-priority--${PRIORITY_TONE[card.priority]}`,
  }, [
    h('span', { class: 'kanban-use-case-priority__dot' }),
    card.priority,
  ]);
}

function avatarStack(h: HyperScript, card: KanbanUseCaseCard) {
  return h('span', {
    class: 'kanban-use-case-avatar-stack',
    title: card.assignees.join(', '),
  }, card.assignees.map((assignee) => avatarTemplate(h, {
    ariaLabel: assignee,
    className: 'kanban-use-case-owner__avatar',
    index: avatarIndex(assignee),
    label: assignee,
    size: 18,
    value: assignee,
  })));
}

function fact(h: HyperScript, label: string, value: string, modifier = '') {
  return h('span', { class: `kanban-use-case-fact${modifier ? ` kanban-use-case-fact--${modifier}` : ''}` }, [
    h('span', { class: 'kanban-use-case-fact__label' }, label),
    h('strong', { class: 'kanban-use-case-fact__value', title: value }, value),
  ]);
}

function renderDeliveryCard(h: HyperScript, card: KanbanUseCaseCard) {
  const progress = card.progress ?? 0;
  const stageLabel: Record<string, string> = {
    discovery: 'Customer question',
    design: 'Design handoff',
    build: 'Release scope',
    review: 'Release check',
    released: 'Shipped in',
  };
  const stageValue = card.status === 'released'
    ? `${cardValue(card, 'release')} · ${compactDate(card.dueDate)}`
    : card.status === 'build'
      ? `${cardValue(card, 'release')} · ${cardValue(card, 'storyPoints', '0')} pts`
      : cardValue(card, 'handoff', card.context ?? card.description);
  const progressBlock = kanbanUseCaseCardUsesProgress('delivery', card.status)
    ? h('div', { class: 'kanban-use-case-progress', title: `${progress}% complete` }, [
      h('span', { class: 'kanban-use-case-progress__copy' }, [
        h('span', {}, 'Build progress'),
        h('strong', {}, `${progress}%`),
      ]),
      h('span', { class: 'kanban-use-case-progress__track' }, [
        h('span', { class: 'kanban-use-case-progress__bar', style: { width: `${progress}%` } }),
      ]),
    ])
    : null;

  return h('article', { class: cardRootClass('delivery', card) }, [
    h('div', { class: 'kanban-use-case-card-topline' }, [
      h('span', { class: 'kanban-use-case-card-id' }, card.id),
      h('span', { class: 'kanban-use-case-label' }, card.label),
      card.risk ? priorityBadge(h, card) : null,
    ]),
    h('strong', { class: 'kanban-use-case-card-title', title: card.title }, card.title),
    h('p', { title: card.description }, card.description),
    h('div', { class: 'kanban-use-case-delivery-stage' }, [
      h('span', {}, stageLabel[card.status] ?? 'Next handoff'),
      h('strong', { title: stageValue }, stageValue),
    ]),
    progressBlock,
    h('div', { class: 'kanban-use-case-card-meta' }, [
      avatarStack(h, card),
      h('span', { class: 'kanban-use-case-due', title: `Due ${card.dueDate}` }, `Due ${compactDate(card.dueDate)}`),
      card.risk ? h('span', { class: 'kanban-use-case-risk', title: card.risk }, 'At risk') : null,
    ].filter(Boolean)),
  ]);
}

function renderSupportCard(h: HyperScript, card: KanbanUseCaseCard) {
  const slaState = cardValue(card, 'slaState');
  const isUrgent = card.priority === 'Critical' || card.priority === 'High';
  const account = cardValue(card, 'account');
  const actionLabel = card.status === 'waiting-on-customer'
    ? 'Waiting for customer'
    : card.status === 'resolved'
      ? 'Resolution'
      : card.status === 'triage'
        ? 'Triage decision'
        : card.status === 'new' ? 'First response' : 'Investigation owner';
  const actionValue = card.status === 'resolved'
    ? cardValue(card, 'handoff', cardValue(card, 'escalation'))
    : cardValue(card, 'escalation');

  return h('article', { class: cardRootClass('support-ticket', card) }, [
    h('div', { class: 'kanban-use-case-support-identity' }, [
      h('span', { class: 'kanban-use-case-support-monogram', 'aria-hidden': 'true' }, monogram(account)),
      h('span', { class: 'kanban-use-case-support-account' }, [
        h('strong', { title: account }, account),
        h('small', {}, `${card.id} · ${cardValue(card, 'channel')}`),
      ]),
      h('span', { class: 'kanban-use-case-support-severity' }, cardValue(card, 'severity')),
    ]),
    h('strong', { class: 'kanban-use-case-card-title', title: card.title }, card.title),
    h('div', { class: 'kanban-use-case-support-sla' }, [
      h('span', {}, card.status === 'new' ? 'First response SLA' : 'Resolution SLA'),
      h('strong', {
        class: `kanban-use-case-support-clock${isUrgent ? ' kanban-use-case-support-clock--urgent' : ''}`,
      }, slaState),
    ]),
    h('div', { class: 'kanban-use-case-support-next' }, [
      h('span', {}, actionLabel),
      h('strong', { title: actionValue }, actionValue),
    ]),
    h('div', { class: 'kanban-use-case-support-footer' }, [
      h('span', { title: card.label }, card.label),
      h('strong', {}, card.owner),
    ]),
  ]);
}

function renderRevenueCard(h: HyperScript, card: KanbanUseCaseCard) {
  const account = cardValue(card, 'account');
  const stageLabels: Record<string, string> = {
    qualified: 'Next decision',
    solution: 'Solution handoff',
    contract: 'Commercial decision',
    implementation: 'Implementation focus',
    live: 'First-value review',
  };
  const stageValue = card.status === 'implementation'
    ? cardValue(card, 'implementation', cardValue(card, 'handoff'))
    : card.status === 'live'
      ? cardValue(card, 'context', cardValue(card, 'handoff'))
      : cardValue(card, 'handoff');
  const targetDate = card.status === 'implementation' || card.status === 'live'
    ? `Go live ${compactDate(cardValue(card, 'goLiveDate'))}`
    : `Close ${compactDate(card.dueDate)}`;

  return h('article', { class: cardRootClass('revenue-opportunity', card) }, [
    h('div', { class: 'kanban-use-case-revenue-account' }, [
      h('span', { class: 'kanban-use-case-revenue-monogram', 'aria-hidden': 'true' }, monogram(account)),
      h('span', { class: 'kanban-use-case-revenue-name' }, [
        h('small', {}, `${card.id} · ${card.lane}`),
      ]),
      h('strong', { class: 'kanban-use-case-revenue-value' }, cardValue(card, 'arr')),
    ]),
    h('strong', { class: 'kanban-use-case-card-title', title: card.title }, card.title),
    h('span', { class: 'kanban-use-case-revenue-solution' }, cardValue(card, 'solution', card.label)),
    h('div', { class: 'kanban-use-case-revenue-next' }, [
      h('span', {}, stageLabels[card.status] ?? 'Next customer move'),
      h('strong', { title: stageValue }, stageValue),
    ]),
    h('div', { class: 'kanban-use-case-card-meta' }, [
      avatarStack(h, card),
      h('span', { class: 'kanban-use-case-revenue-owner' }, card.owner),
      h('span', { class: 'kanban-use-case-revenue-date' }, [
        fontAwesomeIcon(h, 'calendar', 'date'),
        h('span', {}, targetDate),
      ]),
    ]),
    card.risk ? h('div', { class: 'kanban-use-case-revenue-risk', title: card.risk }, `Blocked · ${card.risk}`) : null,
  ]);
}

function renderEditorialCard(h: HyperScript, card: KanbanUseCaseCard) {
  const stageLabels: Record<string, string> = {
    briefed: 'Brief intake',
    creating: 'Draft focus',
    editorial: 'Editorial decision',
    approval: 'Approval gate',
    publish: 'Publish state',
  };
  const stageValue = card.status === 'approval'
    ? cardValue(card, 'legalReviewer')
    : card.status === 'publish'
      ? cardValue(card, 'publishState')
      : cardValue(card, 'handoff', cardValue(card, 'publishState'));

  return h('article', { class: cardRootClass('editorial-approval', card) }, [
    h('div', { class: 'kanban-use-case-editorial-masthead' }, [
      h('span', {}, cardValue(card, 'campaign')),
      h('span', {}, card.id),
    ]),
    h('strong', { class: 'kanban-use-case-card-title', title: card.title }, card.title),
    h('p', { title: card.description }, card.description),
    h('div', { class: 'kanban-use-case-editorial-proof' }, [
      h('span', {}, stageLabels[card.status] ?? 'Review state'),
      h('strong', { title: stageValue }, stageValue),
    ]),
    h('div', { class: 'kanban-use-case-editorial-tags' }, [
      h('span', {}, cardValue(card, 'channel')),
      h('span', {}, cardValue(card, 'locale')),
      h('span', {}, card.label),
    ]),
    h('div', { class: 'kanban-use-case-editorial-footer' }, [
      h('span', {}, `Publish ${compactDate(cardValue(card, 'publishDate', card.dueDate))}`),
      h('strong', {}, card.owner),
    ]),
  ]);
}

function renderQualityCard(h: HyperScript, card: KanbanUseCaseCard) {
  const stageLabels: Record<string, string> = {
    detected: 'Measured result',
    containment: 'Containment impact',
    capa: 'Corrective action',
    verification: 'Verification evidence',
    closed: 'Closure evidence',
  };
  const stageValue = card.status === 'containment'
    ? `${cardValue(card, 'unitsHeld', '0')} units held · ${cardValue(card, 'material')}`
    : card.status === 'closed'
      ? cardValue(card, 'handoff', card.description)
      : card.status === 'capa'
        ? cardValue(card, 'risk', cardValue(card, 'defect'))
        : `${cardValue(card, 'inspection')} · ${cardValue(card, 'defect')}`;

  return h('article', { class: cardRootClass('quality-inspection', card) }, [
    h('div', { class: 'kanban-use-case-quality-strip' }, [
      h('span', {}, cardValue(card, 'workOrder')),
      h('strong', {}, cardValue(card, 'severity')),
    ]),
    h('strong', { class: 'kanban-use-case-card-title', title: card.title }, card.title),
    h('div', { class: 'kanban-use-case-quality-identifiers' }, [
      fact(h, 'Lot', cardValue(card, 'lot')),
      fact(h, 'Station', cardValue(card, 'machine')),
    ]),
    h('div', { class: 'kanban-use-case-quality-result' }, [
      h('span', {}, stageLabels[card.status] ?? 'Inspection record'),
      h('strong', { title: stageValue }, stageValue),
    ]),
    h('div', { class: 'kanban-use-case-card-meta' }, [
      h('span', { class: 'kanban-use-case-card-id' }, card.id),
      h('span', {}, card.owner),
      h('strong', {}, card.dueDate),
    ]),
  ]);
}

function rawSvgIcon(h: HyperScript, name: KanbanUseCaseIconName, className: string) {
  return h('span', {
    class: className,
    'aria-hidden': 'true',
    innerHTML: FONT_AWESOME_ICONS[name],
  });
}

function fontAwesomeIcon(h: HyperScript, name: KanbanUseCaseIconName, modifier: string) {
  return rawSvgIcon(h, name, `kanban-use-case-icon kanban-use-case-icon--${modifier}`);
}

function renderInternalRequestCard(h: HyperScript, card: KanbanUseCaseCard) {
  const stageLabels: Record<string, string> = {
    intake: 'Request scope',
    assigned: 'Current owner',
    approval: 'Decision needed',
    fulfillment: 'Fulfillment handoff',
    complete: 'Outcome',
  };
  const stageValue = card.status === 'approval'
    ? cardValue(card, 'approval')
    : card.status === 'fulfillment'
      ? cardValue(card, 'handoff')
      : card.status === 'complete'
        ? cardValue(card, 'context', 'Completed with evidence')
        : card.status === 'assigned' ? card.owner : cardValue(card, 'requestValue');
  const stageIcons: Record<string, KanbanUseCaseIconName> = {
    intake: 'clipboard-list',
    assigned: 'user',
    approval: 'scale-balanced',
    fulfillment: 'arrows-left-right',
    complete: 'check-circle',
  };

  return h('article', { class: cardRootClass('internal-request', card) }, [
    h('div', { class: 'kanban-use-case-request-head' }, [
      h('span', {}, card.label),
      h('span', {}, card.id),
    ]),
    h('strong', { class: 'kanban-use-case-card-title', title: card.title }, card.title),
    h('div', { class: 'kanban-use-case-request-route' }, [
      fontAwesomeIcon(h, 'user', 'requester'),
      h('span', {}, cardValue(card, 'requester')),
      fontAwesomeIcon(h, 'arrow-right', 'route'),
      h('strong', {}, card.owner),
    ]),
    h('div', { class: 'kanban-use-case-request-value' }, [
      fontAwesomeIcon(h, 'building', 'department'),
      h('span', {}, cardValue(card, 'department')),
      h('strong', {}, cardValue(card, 'requestValue')),
    ]),
    h('div', { class: 'kanban-use-case-request-approval' }, [
      fontAwesomeIcon(h, stageIcons[card.status] ?? 'check-circle', 'stage'),
      h('div', { class: 'kanban-use-case-request-approval-copy' }, [
        h('span', {}, stageLabels[card.status] ?? 'Decision state'),
        h('strong', { title: stageValue }, stageValue),
      ]),
    ]),
    h('div', { class: 'kanban-use-case-card-meta' }, [
      priorityBadge(h, card),
      h('span', { class: 'kanban-use-case-due' }, `Due ${card.dueDate}`),
    ].filter(Boolean)),
  ]);
}

function renderUseCaseCard(
  h: HyperScript,
  card: KanbanUseCaseCard,
  presentation: KanbanUseCaseCardPresentation,
) {
  switch (presentation) {
    case 'support-ticket': return renderSupportCard(h, card);
    case 'revenue-opportunity': return renderRevenueCard(h, card);
    case 'editorial-approval': return renderEditorialCard(h, card);
    case 'quality-inspection': return renderQualityCard(h, card);
    case 'internal-request': return renderInternalRequestCard(h, card);
    default: return renderDeliveryCard(h, card);
  }
}

function avatarIndex(name: string): number {
  return [...name].reduce((value, character) => value + character.charCodeAt(0), 0) % 8;
}

export function createKanbanUseCaseConfig(
  scenario: KanbanUseCaseScenario,
): KanbanConfig<KanbanUseCaseCard> {
  const workflowColumns = scenario.workflowColumns.map((column) => {
    const icon = scenario.headerIcons?.[String(column.prop)];
    if (!icon) return column;

    return {
      ...column,
      columnTemplate: (h, props) => {
        const { visibleCount, totalCount, overWipLimit, toggleCollapsed } = props.kanban;
        const title = column.name ?? String(column.prop);
        const collapsed = props.kanban.column.collapsed === true;
        return h('div', {
          class: [
            'kanban-column-header',
            collapsed ? 'kanban-column-header--collapsed' : '',
            overWipLimit ? 'kanban-column-header--over-wip' : '',
          ].filter(Boolean).join(' '),
          'data-kanban-column-prop': String(column.prop),
          'data-kanban-column-prop-type': typeof column.prop,
        }, [
          rawSvgIcon(h, icon, `kanban-use-case-column-icon kanban-use-case-column-icon--${column.prop}`),
          h('span', { class: 'kanban-column-header__title' }, title),
          h('span', { class: 'kanban-column-header__count' }, String(visibleCount)),
          column.wipLimit === undefined
            ? null
            : h('span', { class: 'kanban-column-header__wip' }, `${totalCount} of ${column.wipLimit} WIP`),
          props.kanban.column.collapsible
            ? h('button', {
              type: 'button',
              class: 'kanban-column-header__toggle',
              'aria-expanded': String(!collapsed),
              'aria-label': collapsed
                ? `Expand column: ${title}`
                : `Collapse column: ${title}`,
              onClick: toggleCollapsed,
            }, rawSvgIcon(h, 'chevron-down', 'kanban-column-header__toggle-icon'))
            : null,
        ]);
      },
    };
  });

  return {
    idField: 'id',
    columnField: 'status',
    orderField: 'order',
    columns: workflowColumns,
    ...(scenario.useSwimlanes ? {
      swimlaneField: 'lane',
      swimlanes: scenario.swimlanes,
      swimlaneLayout: scenario.swimlaneLayout ?? 'column',
      swimlaneColumn: scenario.swimlaneLayout === 'top' ? false : {
        collapsible: true,
        width: scenario.layout.swimlaneWidth,
        collapsedWidth: scenario.layout.collapsedSwimlaneWidth,
      },
    } : {
      swimlaneColumn: false,
    }),
    contextMenu: {
      hidden: { open: true, edit: true, create: true, delete: true },
    },
    card: { titleField: 'title', descriptionField: 'description' },
    cardRules: [{
      id: 'priority-risk',
      when: ({ card }) => Boolean(card.risk),
      result: { className: 'kanban-use-case-card--risk' },
    }],
    customization: {
      swimlaneHeader: (h, { swimlane }) => h('div', { class: 'kanban-use-case-lane-heading' }, [
        h('span', { class: 'kanban-use-case-lane-kicker' }, 'WORKSTREAM'),
        h('strong', { class: 'kanban-use-case-lane-title' }, swimlane.title),
      ]),
      cardContent: (h, { card }) => renderUseCaseCard(h, card, scenario.cardPresentation),
    },
    labels: {
      emptyColumn: 'Drop work here',
      cardCount: (visible, total) => visible === total ? String(total) : `${visible}/${total}`,
    },
    cardRowHeight: scenario.layout.cardRowHeight,
    wipBehavior: scenario.wipBehavior ?? 'warn',
  };
}

export function validateKanbanUseCaseScenario(scenario: KanbanUseCaseScenario): string[] {
  const failures: string[] = [];
  const cardIds = new Set<string>();
  const bucketOrders = new Set<string>();
  const workflowIds = new Set(scenario.workflowColumns.map((column) => String(column.prop)));
  const swimlaneIds = new Set(scenario.swimlanes.map((swimlane) => String(swimlane.id)));

  if (scenario.metrics.length < 3) failures.push('at least three operational metrics are required');
  if (scenario.cards.length < 12) failures.push('at least twelve production-shaped cards are required');
  if (scenario.columns.length < 5) failures.push('at least five table columns are required');
  if (scenario.workflowColumns.length < 4) failures.push('at least four workflow columns are required');
  if (scenario.useSwimlanes && scenario.swimlanes.length < 2) failures.push('at least two swimlanes are required');
  if (scenario.layout.cardRowHeight < 180) failures.push('card row height must remain readable');
  if (scenario.layout.swimlaneWidth < 140) failures.push('swimlane width must remain readable');
  if (scenario.layout.collapsedSwimlaneWidth < 36) failures.push('collapsed swimlane width must remain operable');

  for (const card of scenario.cards) {
    if (cardIds.has(card.id)) failures.push(`duplicate card id: ${card.id}`);
    cardIds.add(card.id);
    if (!workflowIds.has(card.status)) failures.push(`card ${card.id} references missing workflow column ${card.status}`);
    if (!swimlaneIds.has(card.lane)) failures.push(`card ${card.id} references missing swimlane ${card.lane}`);
    if (!Number.isFinite(card.order)) failures.push(`card ${card.id} has invalid order`);
    if (card.progress !== undefined && (card.progress < 0 || card.progress > 100)) {
      failures.push(`card ${card.id} has invalid progress ${card.progress}`);
    }

    const orderKey = `${card.lane}|${card.status}|${card.order}`;
    if (bucketOrders.has(orderKey)) failures.push(`duplicate order ${card.order} in ${card.lane}/${card.status}`);
    bucketOrders.add(orderKey);
  }

  if (!scenario.cards.some((card) => card.priority === 'Critical' || card.priority === 'High')) {
    failures.push('at least one high-priority card is required');
  }

  return failures;
}
