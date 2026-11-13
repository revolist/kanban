import type { KanbanCardId } from '../types.js';
import { kanbanIdKey } from './identity.js';

export type KanbanSelectionMode = 'replace' | 'toggle' | 'range' | 'clear' | 'api';

export interface UpdateKanbanSelectionOptions {
  readonly currentIds: readonly KanbanCardId[];
  readonly cardId?: KanbanCardId;
  readonly mode: KanbanSelectionMode;
  readonly orderedCardIds: readonly KanbanCardId[];
  readonly anchorId?: KanbanCardId;
  readonly selectionMode?: 'single' | 'multiple';
}

export function uniqueKanbanCardIds(ids: Iterable<KanbanCardId>): KanbanCardId[] {
  const seen = new Set<string>();
  const unique: KanbanCardId[] = [];
  for (const id of ids) {
    const key = kanbanIdKey(id);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(id);
    }
  }
  return unique;
}

export function pruneKanbanSelection(
  selectedIds: readonly KanbanCardId[],
  allowedIds: ReadonlySet<KanbanCardId> | readonly KanbanCardId[],
): readonly KanbanCardId[] {
  const allowedKeys = new Set([...allowedIds].map(kanbanIdKey));
  return uniqueKanbanCardIds(selectedIds).filter((id) => allowedKeys.has(kanbanIdKey(id)));
}

export function updateKanbanSelection(options: UpdateKanbanSelectionOptions): readonly KanbanCardId[] {
  const { currentIds, cardId, mode, orderedCardIds, anchorId } = options;
  if (mode === 'clear' || cardId === undefined) {
    return [];
  }
  if (options.selectionMode === 'single' || mode === 'replace') {
    return [cardId];
  }
  if (mode === 'api') {
    return uniqueKanbanCardIds([...currentIds, cardId]);
  }
  if (mode === 'toggle') {
    const targetKey = kanbanIdKey(cardId);
    return currentIds.some((id) => kanbanIdKey(id) === targetKey)
      ? currentIds.filter((id) => kanbanIdKey(id) !== targetKey)
      : uniqueKanbanCardIds([...currentIds, cardId]);
  }
  if (anchorId === undefined) {
    return uniqueKanbanCardIds([...currentIds, cardId]);
  }
  const anchorIndex = orderedCardIds.findIndex((id) => kanbanIdKey(id) === kanbanIdKey(anchorId));
  const targetIndex = orderedCardIds.findIndex((id) => kanbanIdKey(id) === kanbanIdKey(cardId));
  if (anchorIndex < 0 || targetIndex < 0) {
    return uniqueKanbanCardIds([...currentIds, cardId]);
  }
  const from = Math.min(anchorIndex, targetIndex);
  const to = Math.max(anchorIndex, targetIndex);
  return uniqueKanbanCardIds([...currentIds, ...orderedCardIds.slice(from, to + 1)]);
}
