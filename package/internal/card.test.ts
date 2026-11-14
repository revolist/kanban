import { expect, it, vi } from 'vitest';
import { renderKanbanCardFrame } from './card.js';
it('keeps nested custom controls from selecting or opening a card', () => {
  const select = vi.fn();
  const edit = vi.fn();
  const frame = renderKanbanCardFrame((_tag, props) => ({ props }), {
    id: 'a',
    index: 0,
    label: 'Card',
    selected: false,
    mutable: true,
    readonly: false,
    selectable: true,
    draggable: true,
    select,
    edit,
    content: null,
    pointerDown: vi.fn(),
    keyDown: vi.fn(),
  });
  const nested = { target: { closest: () => ({ tagName: 'BUTTON' }) } };
  frame.props.onClick(nested);
  frame.props.onDblClick(nested);
  expect(select).not.toHaveBeenCalled();
  expect(edit).not.toHaveBeenCalled();
  const ordinary = { target: { closest: () => null } };
  frame.props.onClick(ordinary);
  frame.props.onDblClick(ordinary);
  expect(select).toHaveBeenCalledOnce();
  expect(edit).toHaveBeenCalledOnce();
});
