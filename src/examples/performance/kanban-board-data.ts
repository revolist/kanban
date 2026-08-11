import type { ColumnRegular, DataType } from '@revolist/revogrid';
import type {
  KanbanCardEditorDialogOptions,
  KanbanConfig,
} from '@revolist/kanban';

const KANBAN_BOARD_WORKFLOW = [
  { prop: 'backlog', name: 'Backlog', color: '#64748b' },
  { prop: 'triage', name: 'Triage', color: '#8b5cf6' },
  { prop: 'ready', name: 'Ready', color: '#06b6d4' },
  { prop: 'design', name: 'Design', color: '#a855f7' },
  { prop: 'development', name: 'Development', color: '#2563eb' },
  { prop: 'testing', name: 'Testing', color: '#eab308' },
  { prop: 'review', name: 'Review', color: '#f59e0b' },
  { prop: 'blocked', name: 'Blocked', color: '#dc2626' },
  { prop: 'release', name: 'Release', color: '#0d9488' },
  { prop: 'done', name: 'Done', color: '#10a778' },
] as const;

type KanbanBoardStatus = typeof KANBAN_BOARD_WORKFLOW[number]['prop'];

export type KanbanBoardCard = DataType & {
  id: string;
  title: string;
  description: string;
  status: KanbanBoardStatus;
  team: 'Product' | 'Platform';
  owner: string;
  priority: 'High' | 'Medium' | 'Low';
  points: number;
  order: number;
  tags: string[];
  assignees: string[];
  startDate: string;
  endDate: string;
  dueDate: string;
  color: string;
};

const CARD_TEMPLATES = [
  ['Customer interview synthesis', 'Turn research notes into opportunity themes.'],
  ['Triage product feedback', 'Group incoming feedback and identify the next action.'],
  ['Define activation metric', 'Agree on the first-value milestone and reporting.'],
  ['Responsive board shell', 'Polish column sizing and compact breakpoints.'],
  ['Persist fractional ranks', 'Store stable card order after cross-column moves.'],
  ['Touch interaction QA', 'Validate pointer capture and edge auto-scroll.'],
  ['Provider cleanup audit', 'Verify view teardown preserves host-owned plugins.'],
  ['Resolve release blocker', 'Remove the final dependency blocking the release.'],
  ['Prepare release notes', 'Document keyboard movement and WIP behavior.'],
  ['50k-card benchmark', 'Track bounded DOM and virtual-stack performance.'],
] as const;

const OWNERS = ['Maya', 'Jon', 'Ari', 'Nora', 'Theo', 'Iris'] as const;
const PRIORITIES = ['High', 'Medium', 'Low'] as const;
const STORY_POINTS = [5, 3, 8, 2, 5, 8, 3, 5, 3, 5] as const;

export const KANBAN_BOARD_ITEM_COUNT = 50_000;

export function createKanbanBoardRows(count = KANBAN_BOARD_ITEM_COUNT): KanbanBoardCard[] {
  return Array.from({ length: count }, (_, index) => {
    const workflowIndex = index % KANBAN_BOARD_WORKFLOW.length;
    const cycle = Math.floor(index / KANBAN_BOARD_WORKFLOW.length);
    const workflow = KANBAN_BOARD_WORKFLOW[workflowIndex];
    const template = CARD_TEMPLATES[workflowIndex];
    const team: KanbanBoardCard['team'] = cycle % 2 === 0 ? 'Product' : 'Platform';
    const owner = OWNERS[(index + cycle) % OWNERS.length];
    const priority = PRIORITIES[index % PRIORITIES.length];
    const sequence = cycle + 1;

    return createCard(
      `KAN-${index + 101}`,
      sequence === 1 ? template[0] : `${template[0]} ${sequence}`,
      template[1],
      workflow.prop,
      team,
      owner,
      priority,
      STORY_POINTS[workflowIndex],
      (Math.floor(cycle / 2) + 1) * 1_000,
      workflow.color,
    );
  });
}

export const KANBAN_BOARD_ROWS = createKanbanBoardRows();

function createCard(id: string, title: string, description: string, status: KanbanBoardCard['status'], team: KanbanBoardCard['team'], owner: string, priority: KanbanBoardCard['priority'], points: number, order: number, color: string): KanbanBoardCard {
  return { id, title, description, status, team, owner, priority, points, order, color,
    tags: status === 'done' ? ['Release'] : ['Kanban', team], assignees: [owner],
    startDate: '2026-08-03T09:00:00.000Z', endDate: '2026-08-05T17:00:00.000Z', dueDate: '2026-08-06' };
}

export const KANBAN_BOARD_COLUMNS: ColumnRegular[] = [
  { prop: 'id', name: 'ID', size: 100 },
  { prop: 'title', name: 'Title', size: 260 },
  { prop: 'status', name: 'Status', size: 120 },
  { prop: 'team', name: 'Team', size: 120 },
  { prop: 'owner', name: 'Owner', size: 110 },
  { prop: 'priority', name: 'Priority', size: 100 },
  { prop: 'points', name: 'Points', size: 90 },
];

export function resolveKanbanBoardRows(rows?: KanbanBoardCard[]): KanbanBoardCard[] {
  return Array.isArray(rows) && rows.length ? rows : KANBAN_BOARD_ROWS;
}

export function createKanbanBoardConfig(): KanbanConfig<KanbanBoardCard> {
  return {
    columns: KANBAN_BOARD_WORKFLOW.map(({ prop, name }) => ({
      prop,
      name,
      size: 270,
    })),
    swimlaneField: 'team',
    swimlanes: [
      { id: 'Product', title: 'Product team', collapsible: true },
      { id: 'Platform', title: 'Platform team', collapsible: true, wipLimits: { review: 260 } },
    ],
    swimlaneColumn: { collapsible: true, width: 210, collapsedWidth: 52 },
    card: { titleField: 'title', descriptionField: 'description', priorityField: 'priority', tagsField: 'tags',
      assigneeField: 'assignees', startDateField: 'startDate', endDateField: 'endDate',
      dueDateField: 'dueDate', colorField: 'color' },
    customization: {
      swimlaneHeader: (h, { swimlane, swimlaneColumnCollapsed }) => h('div', { class: 'kanban-board-lane-heading' }, [
        swimlaneColumnCollapsed ? null : h('span', { class: 'kanban-board-lane-kicker' }, 'TEAM'),
        h('strong', { class: 'kanban-board-lane-title' }, swimlane.title),
      ]),
    },
    labels: { emptyColumn: 'Drop a card here' },
    cardRowHeight: 190,
    wipBehavior: 'warn',
  };
}

export function createKanbanBoardEditor(): KanbanCardEditorDialogOptions<KanbanBoardCard> {
  return {
    hiddenFields: ['progress'],
    fields: [{ id: 'points', label: 'Story points', kind: 'number', field: 'points', fullWidth: false,
      format: (value) => value === undefined ? '' : String(value),
      parse: (value) => Number(value),
      validate: (value) => Number(value) < 0 ? 'Story points cannot be negative.' : undefined }],
    createDraft: ({ request }) => ({
      title: '', description: '', priority: 'Medium', points: 3, tags: ['New'], assignees: [],
      startDate: new Date().toISOString(), endDate: new Date(Date.now() + 86_400_000).toISOString(),
      dueDate: new Date(Date.now() + 172_800_000).toISOString().slice(0, 10), color: '#2563eb',
      team: (request.swimlaneId as KanbanBoardCard['team']) ?? 'Product',
    }),
  };
}
