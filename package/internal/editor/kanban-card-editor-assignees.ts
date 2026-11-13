import type { KanbanCardEditorOption } from './kanban-card-editor-dialog.types.js';
export function resolveKanbanCardEditorAssigneeResources(
  options: readonly KanbanCardEditorOption[],
  value: unknown,
): readonly KanbanCardEditorOption[] {
  const resources = new Map(options.map((option) => [resourceKey(option.value), option]));
  for (const selected of toArray(value)) {
    if (!isResourceId(selected)) {
      continue;
    }
    const key = resourceKey(selected);
    if (!resources.has(key)) {
      resources.set(key, { value: selected, label: String(selected) });
    }
  }
  return [...resources.values()];
}

function toArray(value: unknown): readonly unknown[] {
  if (value === null || value === undefined || value === '') {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function isResourceId(value: unknown): value is string | number {
  return (typeof value === 'string' && value.trim() !== '') || (typeof value === 'number' && Number.isFinite(value));
}

function resourceKey(value: string | number): string {
  return `${typeof value}:${String(value)}`;
}
