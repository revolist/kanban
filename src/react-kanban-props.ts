// Plugin properties are not declared by the separately published Core React wrapper.
// Import this module in React consumers; runtime properties remain owned by Kanban.
import type { KanbanConfig, KanbanCardEditorDialogOptions } from '@revolist/kanban';
import '@revolist/revogrid';

declare module '@revolist/revogrid' {
  namespace JSX {
    interface RevoGrid {
      kanban?: KanbanConfig<any> | false;
      kanbanCardEditorDialog?: KanbanCardEditorDialogOptions<any> | false;
    }
  }
}
