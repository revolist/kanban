import type { PluginProviders } from '@revolist/revogrid';
import { describe, expect, it } from 'vitest';
import { INTERNAL_WORKFLOWS_SCENARIO } from './internal-workflows/internal-workflows.data';
import { PRODUCT_DELIVERY_SCENARIO } from './product-delivery/product-delivery.data';
import {
  createKanbanUseCasePlugins,
  DisableKanbanColumnMovePlugin,
} from './kanban-use-case-plugins';

describe('Kanban use-case plugins', () => {
  it('cancels workflow-column dragging only for the opted-out scenario', () => {
    expect(createKanbanUseCasePlugins(INTERNAL_WORKFLOWS_SCENARIO)).toHaveLength(2);
    expect(createKanbanUseCasePlugins(INTERNAL_WORKFLOWS_SCENARIO)[0]).toBe(
      DisableKanbanColumnMovePlugin,
    );
    expect(createKanbanUseCasePlugins(PRODUCT_DELIVERY_SCENARIO)).toHaveLength(1);

    const grid = document.createElement('revo-grid') as HTMLRevoGridElement;
    const plugin = new DisableKanbanColumnMovePlugin(
      grid,
      {} as PluginProviders,
    );
    const columnDrag = new CustomEvent('columndragstart', {
      cancelable: true,
      detail: {},
    });

    grid.dispatchEvent(columnDrag);
    expect(columnDrag.defaultPrevented).toBe(true);

    plugin.destroy();
    const dragAfterDestroy = new CustomEvent('columndragstart', {
      cancelable: true,
      detail: {},
    });
    grid.dispatchEvent(dragAfterDestroy);
    expect(dragAfterDestroy.defaultPrevented).toBe(false);
  });
});
