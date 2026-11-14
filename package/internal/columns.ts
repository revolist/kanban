import { h as gridH, type VNode, type ColumnRegular, type ColumnProp, type DataType } from '@revolist/revogrid';
import { renderControl } from '@revolist/ui/native';
import { renderKanbanCardFrame, renderKanbanCardContent } from './card.js';
import { resolveKanbanLabels } from '../labels.js';
import type { KanbanConfig, KanbanProjection, KanbanCardId, KanbanProjectedCard } from '../types.js';
const h = gridH as unknown as (tag: string, props?: Record<string, unknown>, children?: unknown) => VNode;
export interface ColumnBoardActions {
  readonly selected: () => readonly KanbanCardId[];
  readonly canCreate: () => boolean;
  readonly create: (target: { columnProp: ColumnProp }) => void;
  readonly edit: (id: KanbanCardId) => void;
  readonly collapse: (prop: ColumnProp, collapsed: boolean) => void;
  readonly select: (id: KanbanCardId, event: MouseEvent) => void;
  readonly pointer: (event: PointerEvent, id: KanbanCardId) => void;
  readonly key: (event: KeyboardEvent, id: KanbanCardId, column: ColumnProp) => void;
}
/** One projection snapshot supplies rows, templates and permissions for a render pass. */
export function createColumnBoardView<T extends DataType>(
  c: KanbanConfig<T>,
  p: KanbanProjection<T>,
  actions: ColumnBoardActions,
): { rows: DataType[]; columns: ColumnRegular[] } {
  const buckets = new Map<ColumnProp, KanbanProjectedCard<T>[]>();
  for (const card of p.cards) {
    if (p.visibleCardIds.has(card.id)) {
      const bucket = buckets.get(card.location.columnProp) ?? [];
      bucket.push(card);
      buckets.set(card.location.columnProp, bucket);
    }
  }
  const columns: ColumnRegular[] = p.columns.map((column) => {
    const items = buckets.get(column.prop) ?? [];
    return {
      prop: column.prop,
      name: column.name ?? String(column.prop),
      readonly: true,
      sortable: false,
      size: column.collapsed ? 56 : (column.size ?? 288),
      minSize: column.minSize ?? 56,
      maxSize: column.maxSize,
      columnTemplate: () =>
        h('span', { class: 'kanban-community-column-title' }, [
          column.collapsed
            ? null
            : h(
                'span',
                { class: 'kanban-community-column-caption' },
                `${column.name ?? column.prop} (${items.length})`,
              ),
          column.collapsible !== false
            ? renderControl(
                h,
                'button',
                {
                  type: 'button',
                  'aria-label': resolveKanbanLabels(c.labels)[column.collapsed ? 'expandColumn' : 'collapseColumn'],
                  'aria-expanded': String(!column.collapsed),
                  onClick: () => actions.collapse(column.prop, !column.collapsed),
                },
                column.collapsed ? '+' : '−',
              )
            : null,
        ]),
      cellTemplate: (_h, { model }) => {
        const index = Number(model.__kanbanCommunityIndex);
        const projected = items[index];
        const attributes = {
          'data-kanban-community-column': String(column.prop),
          'data-kanban-community-column-type': typeof column.prop,
          'data-kanban-community-index': String(index),
        };
        if (column.collapsed) {
          return h('div', { class: 'kanban-community-collapsed' });
        }
        if (!projected) {
          return h(
            'div',
            { ...attributes, class: 'kanban-community-stack' },
            index === items.length && actions.canCreate()
              ? renderControl(
                  h,
                  'button',
                  {
                    type: 'button',
                    'aria-label': resolveKanbanLabels(c.labels).add,
                    onClick: () => actions.create({ columnProp: column.prop }),
                  },
                  '+',
                )
              : null,
          );
        }
        const title =
          c.card?.title?.(projected.card) ??
          String(projected.card[c.fields?.title ?? c.card?.titleField ?? 'title'] ?? projected.id);
        const selected = actions.selected().includes(projected.id);
        const dragPermission = c.rules?.canDrag?.(projected.card);
        return h(
          'div',
          { ...attributes, class: 'kanban-community-stack' },
          renderKanbanCardFrame(h, {
            id: projected.id,
            index,
            label: title,
            selected,
            mutable: projected.mutable,
            readonly: c.readOnly === true || c.rules?.canEdit?.(projected.card) === false,
            selectable: c.rules?.canSelect?.(projected.card) !== false,
            draggable: !c.readOnly && dragPermission !== false && typeof dragPermission !== 'string',
            attributes: {
              class: `kanban-community-card${selected ? ' is-selected' : ''}`,
              style: { touchAction: 'none' },
            },
            select: (event: MouseEvent) => actions.select(projected.id, event),
            pointerDown: (event) => actions.pointer(event, projected.id),
            keyDown: (event) => actions.key(event, projected.id, column.prop),
            edit: () => actions.edit(projected.id),
            content: renderKanbanCardContent(h, {
              title,
              description:
                c.card?.description?.(projected.card) ?? projected.card[c.card?.descriptionField ?? 'description'],
              custom: c.customization?.cardContent?.(h, { card: projected.card, column, selected }),
            }),
          }),
        );
      },
    };
  });

  const height = p.columns.reduce(
    (max, column) => Math.max(max, column.collapsed ? 0 : (buckets.get(column.prop)?.length ?? 0)),
    0,
  );
  return { columns, rows: Array.from({ length: height + 1 }, (_, index) => ({ __kanbanCommunityIndex: index })) };
}
