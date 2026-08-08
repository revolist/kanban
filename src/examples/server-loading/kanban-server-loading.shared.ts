import type { ColumnRegular } from '@revolist/revogrid';

export interface ServerCard {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'review' | 'done';
  team: 'Product' | 'Platform' | 'Growth';
  order: number;
}

export const KANBAN_SERVER_COLUMNS: ColumnRegular[] = [
  { prop: 'title', name: 'Title' },
  { prop: 'status', name: 'Status' },
  { prop: 'team', name: 'Team' },
  { prop: 'order', name: 'Order' },
];

export const KANBAN_SERVER_CARD_COUNT = 100_000;
export const KANBAN_SERVER_PAGE_SIZE = 100;

const SERVER_STATUS_CYCLE_SIZE = 1_000;
const SERVER_STATUS_COUNTS: Readonly<Record<ServerCard['status'], number>> = {
  todo: 475,
  doing: 340,
  review: 160,
  done: 25,
};
const SERVER_PLACEMENT_CYCLE = createServerPlacementCycle();

export function createKanbanServerConfig(notify: (message: string) => void) {
  return {
    columns: [
      { prop: 'todo', name: 'To do' },
      { prop: 'doing', name: 'Doing' },
      { prop: 'review', name: 'Review' },
      { prop: 'done', name: 'Done' },
    ],
    swimlaneField: 'team',
    swimlaneLayout: 'top' as const,
    swimlanes: [
      { id: 'Product', title: 'Product' },
      { id: 'Platform', title: 'Platform' },
      { id: 'Growth', title: 'Growth' },
    ],
    card: { titleField: 'title' },
    cardRowHeight: 132,
    remote: {
      total: KANBAN_SERVER_CARD_COUNT,
      chunkSize: KANBAN_SERVER_PAGE_SIZE,
      placeholder: createServerPlaceholder,
      loadData: async (skip: number, limit: number) => {
        const start = Math.max(0, Math.trunc(skip));
        const size = Math.max(0, Math.trunc(limit));
        const end = Math.min(start + size, KANBAN_SERVER_CARD_COUNT);
        notify('Loading cards from server…');
        await new Promise((resolve) => setTimeout(resolve, 450));
        const data = Array.from({ length: Math.max(0, end - start) }, (_, offset) => (
          createServerCard(start + offset)
        ));
        notify(
          `Loaded from server: ${formatNumber(end)} of ${formatNumber(KANBAN_SERVER_CARD_COUNT)} cards.`,
        );
        return { data, total: KANBAN_SERVER_CARD_COUNT };
      },
    },
  };
}

function createServerPlaceholder(index: number): ServerCard {
  const number = index + 1;
  const placement = createServerPlacement(index);
  return {
    id: `server-${number}`,
    title: '',
    ...placement,
  };
}

function createServerCard(index: number): ServerCard {
  const number = index + 1;
  const placement = createServerPlacement(index);
  return {
    id: `server-${number}`,
    title: `Server card ${formatNumber(number)}`,
    ...placement,
  };
}

function createServerPlacement(index: number): Pick<ServerCard, 'status' | 'team' | 'order'> {
  const cycle = Math.floor(index / SERVER_STATUS_CYCLE_SIZE);
  const placement = SERVER_PLACEMENT_CYCLE[index % SERVER_STATUS_CYCLE_SIZE];
  return {
    status: placement.status,
    team: placement.team,
    order: (cycle * SERVER_STATUS_COUNTS[placement.status] + placement.rank) * 1_000,
  };
}

function createServerPlacementCycle(): readonly {
  readonly status: ServerCard['status'];
  readonly team: ServerCard['team'];
  readonly rank: number;
}[] {
  const ranks: Record<ServerCard['status'], number> = {
    todo: 0,
    doing: 0,
    review: 0,
    done: 0,
  };
  return Array.from({ length: SERVER_STATUS_CYCLE_SIZE }, (_, position) => {
    const status = resolveServerStatus(position);
    ranks[status] += 1;
    return { status, team: resolveServerTeam(position), rank: ranks[status] };
  });
}

function resolveServerTeam(position: number): ServerCard['team'] {
  if (position < 400) return 'Product';
  if (position < 700) return 'Platform';
  return 'Growth';
}

function resolveServerStatus(position: number): ServerCard['status'] {
  if (position < KANBAN_SERVER_PAGE_SIZE) {
    return ['todo', 'doing', 'review', 'done'][position % 4] as ServerCard['status'];
  }
  const slot = position % 20;
  if (slot < 7) return 'doing';
  if (slot < 10) return 'review';
  return 'todo';
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}
