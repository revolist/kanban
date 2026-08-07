import { createKanbanShowcaseConfig } from '../src/examples/showcase/kanban.shared';

export function createWorkflowAndWipRecipe() {
  const config = createKanbanShowcaseConfig();
  return {
    ...config,
    columns: config.columns.map((column) => column.prop === 'progress'
      ? { ...column, wipLimit: 3 }
      : column),
  };
}
