import type { KanbanToolbarFilter, KanbanToolbarOptions } from './types.js';
export const DEFAULT_TOOLBAR_ACTIONS = ['add', 'edit', 'delete'] as const;
export function toolbarModel(kanban: any) {
  const active = !!kanban?.getConfig();
  const selected = active ? kanban.getSelectedCardIds() : [];
  return {
    active,
    pending: false,
    selected: selected.length,
    total: active ? kanban.getCards().length : 0,
    visible: active ? (kanban.getProjection()?.visibleCardIds.size ?? 0) : 0,
    enabled: {
      add: active && !!kanban.canCreateCard(),
      edit: active && selected.length === 1 && !!kanban.canEditCard(selected[0]),
      delete: active && !!kanban.canDeleteCards(selected),
    } as Readonly<Record<string, boolean>>,
  };
}
export type KanbanToolbarModel = ReturnType<typeof toolbarModel>;
export function toolbarFilters(
  config: any | undefined,
  options: KanbanToolbarOptions,
  workflowLabel: string,
): readonly KanbanToolbarFilter[] {
  const filters: KanbanToolbarFilter[] =
    options.workflowFilter === false || !config
      ? []
      : [
          {
            id: '__workflow',
            label: workflowLabel,
            field: config.columnField ?? config.fields?.status ?? 'status',
            options: (config.columns ?? []).map((column: any) => ({
              value: column.prop,
              label: column.name ?? String(column.prop),
            })),
          },
        ];
  const ids = new Set(filters.map((filter) => filter.id));
  for (const filter of options.filters ?? []) {
    if (!ids.has(filter.id)) {
      ids.add(filter.id);
      filters.push(filter);
    }
  }
  return filters;
}
