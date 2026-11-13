import type { KanbanCardId } from '../types.js';
export type CardH = (tag: string, props?: Record<string, any>, children?: any) => any;
export interface CardFrame {
  readonly id: KanbanCardId;
  readonly index: number;
  readonly label: string;
  readonly selected: boolean;
  readonly mutable: boolean;
  readonly readonly: boolean;
  readonly selectable: boolean;
  readonly draggable: boolean;
  readonly attributes?: Record<string, any>;
  readonly extraShortcuts?: string;
  readonly select: (event: MouseEvent) => void;
  readonly pointerDown: (event: PointerEvent, element: HTMLElement) => void;
  readonly keyDown: (event: KeyboardEvent) => void;
  readonly edit: () => void;
  readonly content: any;
}
/** Both editions use the same focus, permission and nested-control event ownership. */
export function renderKanbanCardFrame(h: CardH, card: CardFrame) {
  return h(
    'article',
    {
      ...card.attributes,
      role: 'group',
      tabIndex: card.selectable || card.draggable ? 0 : -1,
      'aria-disabled': String(!card.selectable),
      'aria-invalid': String(!card.mutable),
      'aria-selected': String(card.selected),
      'aria-label': card.label,
      'aria-keyshortcuts': [
        'Enter Space Control+Space Meta+Space Shift+Space ArrowLeft ArrowRight ArrowUp ArrowDown Escape',
        card.extraShortcuts,
      ]
        .filter(Boolean)
        .join(' '),
      'data-kanban-card-id': String(card.id),
      'data-kanban-card-id-type': typeof card.id,
      'data-kanban-card-index': String(card.index),
      'data-kanban-community-card': String(card.id),
      onClick: (event: MouseEvent) => {
        if (card.selectable) {
          card.select(event);
        }
      },
      onPointerDown: (event: PointerEvent) => {
        if (
          !card.draggable ||
          (event.target as Element)?.closest?.(
            'button, a, input, select, textarea, [contenteditable="true"], [data-kanban-no-drag]',
          )
        ) {
          return;
        }
        card.pointerDown(event, event.currentTarget as HTMLElement);
      },
      onDblClick: () => {
        if (!card.readonly) {
          card.edit();
        }
      },
      onKeyDown: (event: KeyboardEvent) => {
        if (event.target === event.currentTarget) {
          card.keyDown(event);
        }
      },
    },
    card.content,
  );
}
/** Product-specific metadata is supplied as content slots around ordinary card text. */
export function renderKanbanCardContent(
  h: CardH,
  options: {
    readonly title: string;
    readonly description?: unknown;
    readonly before?: any;
    readonly after?: any;
    readonly between?: any;
    readonly custom?: any;
  },
) {
  return h(
    'div',
    { class: 'kanban-card__content' },
    options.custom === undefined
      ? [
          ...[].concat(options.before ?? []),
          h('div', { class: 'kanban-card__title' }, options.title),
          ...[].concat(options.between ?? []),
          options.description === undefined || options.description === null || options.description === ''
            ? null
            : h('div', { class: 'kanban-card__description' }, String(options.description)),
          ...[].concat(options.after ?? []),
        ]
      : h('div', { class: 'kanban-card__component' }, options.custom),
  );
}
