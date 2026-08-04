import { createKanbanShowcaseConfig } from '../src/kanban.shared';

export function createSwimlanesAndCollapseRecipe() {
  const config = createKanbanShowcaseConfig();
  return {
    ...config,
    swimlaneField: 'team',
    swimlanes: config.swimlanes,
    swimlaneColumn: { collapsible: true, width: 210, collapsedWidth: 52 },
  };
}

