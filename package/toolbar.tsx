import type { PluginProviders } from '@revolist/revogrid';
import { KanbanPlugin } from './plugin.js';
import { resolveKanbanLabels } from './labels.js';
import { KanbanToolbarController, type ToolbarContribution } from './internal/toolbar/controller.js';
export interface KanbanToolbarOptions {
  readonly search?: boolean;
}
export interface KanbanToolbarConfigRegistry {
  community: KanbanToolbarOptions;
}
export type KanbanToolbarHostConfig = KanbanToolbarConfigRegistry[keyof KanbanToolbarConfigRegistry];
declare global {
  interface HTMLRevoGridElement {
    kanbanToolbar?: KanbanToolbarHostConfig | false;
  }
}
declare module '@revolist/revogrid' {
  interface AdditionalData {
    kanbanToolbar?: KanbanToolbarHostConfig | false;
  }
}
export class KanbanToolbarPlugin extends KanbanToolbarController {
  constructor(grid: HTMLRevoGridElement, providers: PluginProviders, contribution?: ToolbarContribution) {
    const board = () => providers.plugins.getByClass(KanbanPlugin);
    super(
      grid,
      providers,
      contribution ?? {
        board,
        role: 'toolbar',
        visible: (plugin) => !!plugin?.getConfig(),
        options: (options) => ({ ...options, showLabels: true }),
        labels: () => {
          const labels = resolveKanbanLabels(board()?.getConfig()?.labels);
          return {
            toolbar: labels.board,
            add: labels.add,
            edit: labels.edit,
            delete: labels.delete,
            search: labels.search,
            board: labels.board,
            selection: labels.selected,
          };
        },
      },
    );
  }
}
