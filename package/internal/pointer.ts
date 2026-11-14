import type { KanbanCardId, KanbanMoveTarget } from '../types.js';
/** Owns one local pointer session and releases every listener before a drop or teardown. */
export class ColumnBoardPointer {
  private release?: () => void;
  constructor(
    private readonly grid: HTMLElement,
    private readonly selected: () => readonly KanbanCardId[],
    private readonly commit: (ids: readonly KanbanCardId[], target: KanbanMoveTarget) => void,
  ) {}
  cancel(): void {
    this.release?.();
    this.release = undefined;
  }
  start(event: PointerEvent, id: KanbanCardId): void {
    if (event.button !== 0 || (event.target as Element)?.closest('input,button,select,textarea,a,[contenteditable]')) {
      return;
    }
    this.cancel();
    const source = event.currentTarget as HTMLElement;
    const document = this.grid.ownerDocument;
    let active = false;
    const move = (next: PointerEvent) => {
      if (next.pointerId !== event.pointerId) {
        return;
      }
      if (active || Math.hypot(next.clientX - event.clientX, next.clientY - event.clientY) > 8) {
        active = true;
        next.preventDefault();
        source.classList.add('is-moving');
      }
    };
    const end = (next: PointerEvent) => {
      if (next.pointerId !== event.pointerId) {
        return;
      }
      this.cancel();
      if (!active) {
        return;
      }
      const stack = document
        .elementFromPoint(next.clientX, next.clientY)
        ?.closest<HTMLElement>('[data-kanban-community-column]');
      if (stack && this.grid.contains(stack)) {
        const value = stack.dataset.kanbanCommunityColumn!;
        const columnProp = stack.dataset.kanbanCommunityColumnType === 'number' ? Number(value) : value;
        const selected = this.selected();
        this.commit(selected.includes(id) ? selected : [id], {
          columnProp,
          index: Number(stack.dataset.kanbanCommunityIndex),
        });
      }
    };
    const cancel = (next: PointerEvent) => {
      if (next.pointerId === event.pointerId) {
        this.cancel();
      }
    };
    document.addEventListener('pointermove', move, { passive: false });
    document.addEventListener('pointerup', end);
    document.addEventListener('pointercancel', cancel);
    this.release = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', end);
      document.removeEventListener('pointercancel', cancel);
      source.classList.remove('is-moving');
    };
  }
}
