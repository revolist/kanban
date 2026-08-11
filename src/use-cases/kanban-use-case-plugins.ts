import { BasePlugin, type GridPlugin, type PluginProviders } from '@revolist/revogrid';
import { KanbanPlugin } from '@revolist/kanban';
import type { KanbanUseCaseScenario } from './kanban-use-case-model';

export class DisableKanbanColumnMovePlugin extends BasePlugin {
  constructor(revogrid: HTMLRevoGridElement, providers: PluginProviders) {
    super(revogrid, providers);
    this.addEventListener('columndragstart', (event) => event.preventDefault());
  }
}

export function createKanbanUseCasePlugins(
  scenario: KanbanUseCaseScenario,
): GridPlugin[] {
  return scenario.allowColumnMove === false
    ? [DisableKanbanColumnMovePlugin, KanbanPlugin]
    : [KanbanPlugin];
}
