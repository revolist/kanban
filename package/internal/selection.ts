import type { KanbanCardId } from '../types.js';
import { kanbanIdKey, pruneKanbanSelection, uniqueKanbanCardIds, updateKanbanSelection } from '../core/index.js';

export type KanbanSelectionMode = 'replace' | 'toggle' | 'range' | 'clear' | 'api';

export interface KanbanSelectionUpdate {
  readonly cardIds: readonly KanbanCardId[];
  readonly mode: KanbanSelectionMode;
}

export class KanbanSelectionController {
  private selected: KanbanCardId[] = [];
  private anchor: KanbanCardId | undefined;

  constructor(
    private readonly multiple = true,
    private readonly onChange?: (update: KanbanSelectionUpdate) => void,
  ) {}

  get(): readonly KanbanCardId[] {
    return [...this.selected];
  }

  has(id: KanbanCardId): boolean {
    const key = kanbanIdKey(id);
    return this.selected.some((selectedId) => kanbanIdKey(selectedId) === key);
  }

  set(ids: readonly KanbanCardId[], mode: KanbanSelectionMode = 'api'): void {
    const next = this.multiple ? uniqueKanbanCardIds(ids) : ids.slice(0, 1);
    this.update(next, mode, next.at(-1));
  }

  clear(mode: KanbanSelectionMode = 'clear'): void {
    this.update([], mode);
  }

  select(
    id: KanbanCardId,
    orderedIds: readonly KanbanCardId[],
    modifiers: { readonly toggle?: boolean; readonly range?: boolean } = {},
  ): void {
    if (!this.multiple) {
      this.update([id], 'replace', id);
      return;
    }
    if (modifiers.range && this.anchor !== undefined) {
      const start = orderedIds.indexOf(this.anchor);
      const end = orderedIds.indexOf(id);
      if (start >= 0 && end >= 0) {
        this.update(
          updateKanbanSelection({
            currentIds: this.selected,
            cardId: id,
            mode: 'range',
            orderedCardIds: orderedIds,
            anchorId: this.anchor,
            selectionMode: 'multiple',
          }),
          'range',
          this.anchor,
        );
        return;
      }
    }
    if (modifiers.toggle) {
      this.update(
        updateKanbanSelection({
          currentIds: this.selected,
          cardId: id,
          mode: 'toggle',
          orderedCardIds: orderedIds,
          anchorId: this.anchor,
          selectionMode: 'multiple',
        }),
        'toggle',
        id,
      );
      return;
    }
    this.update([id], 'replace', id);
  }

  prune(visibleIds: ReadonlySet<KanbanCardId>): void {
    const next = pruneKanbanSelection(this.selected, visibleIds);
    if (next.length !== this.selected.length) {
      this.update(next, 'api', this.anchor);
    }
  }

  private update(ids: readonly KanbanCardId[], mode: KanbanSelectionMode, anchor?: KanbanCardId): void {
    const unique = uniqueKanbanCardIds(ids);
    if (sameIds(unique, this.selected)) {
      return;
    }
    this.selected = unique;
    this.anchor = anchor && this.has(anchor) ? anchor : unique.at(-1);
    this.onChange?.({ cardIds: unique, mode });
  }
}

function sameIds(left: readonly KanbanCardId[], right: readonly KanbanCardId[]): boolean {
  return left.length === right.length && left.every((id, index) => kanbanIdKey(id) === kanbanIdKey(right[index]));
}
