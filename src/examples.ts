export const KANBAN_EXAMPLE_IDS = [
  'showcase',
  'performance',
  'server-loading',
  'product-delivery',
  'support-operations',
  'sales-onboarding',
  'content-approvals',
  'quality-manufacturing',
  'internal-workflows',
] as const;

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
  performance: {
    id: 'performance',
    angularSelector: 'kanban-board-grid',
    loadTs: async () => (await import('./examples/performance/kanban-board')).load,
    loadReact: async () => (await import('./examples/performance/kanban-board.react')).default,
    loadVue: async () => (await import('./examples/performance/kanban-board.vue')).default,
    loadAngular: async () => (await import('./examples/performance/kanban-board.angular')).KanbanBoardGridComponent,
  },
  'server-loading': {
    id: 'server-loading',
    angularSelector: 'kanban-server-loading-grid',
    loadTs: async () => (await import('./examples/server-loading/kanban-server-loading')).load,
    loadReact: async () => (await import('./examples/server-loading/kanban-server-loading.react')).default,
    loadVue: async () => (await import('./examples/server-loading/kanban-server-loading.vue')).default,
    loadAngular: async () => (await import('./examples/server-loading/kanban-server-loading.angular')).KanbanServerLoadingGridComponent,
  },
  'product-delivery': {
    id: 'product-delivery',
    angularSelector: 'kanban-product-delivery-use-case',
    loadTs: async () => (await import('./use-cases/product-delivery/product-delivery')).load,
    loadReact: async () => (await import('./use-cases/product-delivery/product-delivery.react')).default,
    loadVue: async () => (await import('./use-cases/product-delivery/product-delivery.vue')).default,
    loadAngular: async () => (await import('./use-cases/product-delivery/product-delivery.angular')).KanbanProductDeliveryUseCaseComponent,
  },
  'support-operations': {
    id: 'support-operations',
    angularSelector: 'kanban-support-operations-use-case',
    loadTs: async () => (await import('./use-cases/support-operations/support-operations')).load,
    loadReact: async () => (await import('./use-cases/support-operations/support-operations.react')).default,
    loadVue: async () => (await import('./use-cases/support-operations/support-operations.vue')).default,
    loadAngular: async () => (await import('./use-cases/support-operations/support-operations.angular')).KanbanSupportOperationsUseCaseComponent,
  },
  'sales-onboarding': {
    id: 'sales-onboarding',
    angularSelector: 'kanban-sales-onboarding-use-case',
    loadTs: async () => (await import('./use-cases/sales-onboarding/sales-onboarding')).load,
    loadReact: async () => (await import('./use-cases/sales-onboarding/sales-onboarding.react')).default,
    loadVue: async () => (await import('./use-cases/sales-onboarding/sales-onboarding.vue')).default,
    loadAngular: async () => (await import('./use-cases/sales-onboarding/sales-onboarding.angular')).KanbanSalesOnboardingUseCaseComponent,
  },
  'content-approvals': {
    id: 'content-approvals',
    angularSelector: 'kanban-content-approvals-use-case',
    loadTs: async () => (await import('./use-cases/content-approvals/content-approvals')).load,
    loadReact: async () => (await import('./use-cases/content-approvals/content-approvals.react')).default,
    loadVue: async () => (await import('./use-cases/content-approvals/content-approvals.vue')).default,
    loadAngular: async () => (await import('./use-cases/content-approvals/content-approvals.angular')).KanbanContentApprovalsUseCaseComponent,
  },
  'quality-manufacturing': {
    id: 'quality-manufacturing',
    angularSelector: 'kanban-quality-manufacturing-use-case',
    loadTs: async () => (await import('./use-cases/quality-manufacturing/quality-manufacturing')).load,
    loadReact: async () => (await import('./use-cases/quality-manufacturing/quality-manufacturing.react')).default,
    loadVue: async () => (await import('./use-cases/quality-manufacturing/quality-manufacturing.vue')).default,
    loadAngular: async () => (await import('./use-cases/quality-manufacturing/quality-manufacturing.angular')).KanbanQualityManufacturingUseCaseComponent,
  },
  'internal-workflows': {
    id: 'internal-workflows',
    angularSelector: 'kanban-internal-workflows-use-case',
    loadTs: async () => (await import('./use-cases/internal-workflows/internal-workflows')).load,
    loadReact: async () => (await import('./use-cases/internal-workflows/internal-workflows.react')).default,
    loadVue: async () => (await import('./use-cases/internal-workflows/internal-workflows.vue')).default,
    loadAngular: async () => (await import('./use-cases/internal-workflows/internal-workflows.angular')).KanbanInternalWorkflowsUseCaseComponent,
  },
};

export function resolveKanbanExample(search: string): KanbanExampleDefinition {
  const requestedId = new URLSearchParams(search).get('example');
  if (requestedId && KANBAN_EXAMPLE_IDS.includes(requestedId as KanbanExampleId)) {
    return KANBAN_EXAMPLES[requestedId as KanbanExampleId];
  }
  return KANBAN_EXAMPLES[DEFAULT_KANBAN_EXAMPLE_ID];
}
