import { RevoGrid } from '@revolist/react-datagrid';
import type { ComponentProps, ComponentType } from 'react';
import type { KanbanConfig } from '@revolist/kanban';

// Published trial releases predating the shared registries need a local wrapper prop type.
// Keep this adaptation local instead of redeclaring the grid's global properties.
type KanbanGridProps = Omit<ComponentProps<typeof RevoGrid>, 'kanban'> & {
  kanban?: KanbanConfig<any> | false;
};
export const KanbanGrid = RevoGrid as ComponentType<KanbanGridProps>;
