// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { ColumnBoardPointer } from './internal/pointer.js';
import { KanbanPlugin } from './plugin.js';
const cleanup: Array<() => void> = [];
afterEach(() => {
  cleanup.splice(0).forEach((cancel) => cancel());
  document.body.replaceChildren();
});
function pointerEvent(type: string, id: number, x = 40) {
  return Object.assign(new Event(type), { pointerId: id, clientX: x, clientY: 40 });
}
it('ignores another pointer ending or cancelling an active card drag', () => {
  const grid = document.createElement('revo-grid');
  const source = document.createElement('article');
  const target = document.createElement('div');
  target.dataset.kanbanCommunityColumn = 'done';
  target.dataset.kanbanCommunityIndex = '0';
  grid.append(source, target);
  document.body.append(grid);
  document.elementFromPoint = vi.fn(() => target);
  const moveCards = vi.fn();
  const pointer = new ColumnBoardPointer(
    grid,
    () => [],
    (ids, target) => moveCards(ids, target, { reason: 'pointer' }),
  );
  pointer.start(
    {
      button: 0,
      pointerId: 7,
      clientX: 0,
      clientY: 0,
      currentTarget: source,
      target: source,
    } as unknown as PointerEvent,
    'a',
  );
  cleanup.push(() => pointer.cancel());
  document.dispatchEvent(pointerEvent('pointermove', 7));
  document.dispatchEvent(pointerEvent('pointerup', 8));
  document.dispatchEvent(pointerEvent('pointercancel', 8));
  expect(moveCards).not.toHaveBeenCalled();
  expect(source.classList.contains('is-moving')).toBe(true);
  document.dispatchEvent(pointerEvent('pointerup', 7));
  expect(moveCards).toHaveBeenCalledExactlyOnceWith(['a'], { columnProp: 'done', index: 0 }, { reason: 'pointer' });
  expect(source.classList.contains('is-moving')).toBe(false);
});

it('does not initialize or alter a host grid for rejected Community configuration', () => {
  const initialize = vi.fn();
  const instance = Object.assign(Object.create(KanbanPlugin.prototype), {
    revogrid: { source: [] },
    providers: { plugins: { get: () => [] } },
    communityGrid: { initialize },
  });
  expect(() => instance.communityConfigure({ columns: [], history: true })).toThrow();
  expect(initialize).not.toHaveBeenCalled();
});
