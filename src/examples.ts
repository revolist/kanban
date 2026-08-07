export const KANBAN_EXAMPLE_IDS = ['showcase', 'board-30k'] as const;

export type KanbanExampleId = typeof KANBAN_EXAMPLE_IDS[number];
export type KanbanExampleFramework = 'ts' | 'react' | 'vue' | 'angular';

interface KanbanExampleDefinition {
  readonly id: KanbanExampleId;
  readonly angularSelector: string;
  readonly loadTs: () => Promise<(parentSelector: string) => (() => void) | undefined>;
  readonly loadReact: () => Promise<unknown>;
  readonly loadVue: () => Promise<unknown>;
  readonly loadAngular: () => Promise<unknown>;
}

export const DEFAULT_KANBAN_EXAMPLE_ID: KanbanExampleId = 'showcase';

export const KANBAN_EXAMPLES: Readonly<Record<KanbanExampleId, KanbanExampleDefinition>> = {
  showcase: {
    id: 'showcase',
    angularSelector: 'kanban-showcase-grid',
    loadTs: async () => (await import('./examples/showcase/kanban')).load,
    loadReact: async () => (await import('./examples/showcase/kanban.react')).default,
    loadVue: async () => (await import('./examples/showcase/kanban.vue')).default,
    loadAngular: async () => (await import('./examples/showcase/kanban.angular')).KanbanShowcaseGridComponent,
  },
  'board-30k': {
    id: 'board-30k',
    angularSelector: 'kanban-board-grid',
    loadTs: async () => (await import('./examples/board-30k/kanban-board')).load,
    loadReact: async () => (await import('./examples/board-30k/kanban-board.react')).default,
    loadVue: async () => (await import('./examples/board-30k/kanban-board.vue')).default,
    loadAngular: async () => (await import('./examples/board-30k/kanban-board.angular')).KanbanBoardGridComponent,
  },
};

export function resolveKanbanExample(search: string): KanbanExampleDefinition {
  const requestedId = new URLSearchParams(search).get('example');
  if (requestedId && KANBAN_EXAMPLE_IDS.includes(requestedId as KanbanExampleId)) {
    return KANBAN_EXAMPLES[requestedId as KanbanExampleId];
  }
  return KANBAN_EXAMPLES[DEFAULT_KANBAN_EXAMPLE_ID];
}
