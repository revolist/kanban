import { describe, expect, it } from 'vitest';
import { KANBAN_SHOWCASE_ROWS } from '../src/kanban.shared';
import { createWorkflowAndWipRecipe } from './workflow-wip';
import { createSwimlanesAndCollapseRecipe } from './swimlanes-collapse';
import { moveCard } from './card-movement';

describe('Kanban recipes', () => {
  it('applies a focused in-progress WIP limit', () => {
    const column = createWorkflowAndWipRecipe().columns.find((item) => item.prop === 'progress');
    expect(column?.wipLimit).toBe(3);
  });

  it('keeps team swimlanes collapsible', () => {
    const recipe = createSwimlanesAndCollapseRecipe();
    expect(recipe.swimlaneField).toBe('team');
    expect(recipe.swimlaneColumn.collapsible).toBe(true);
  });

  it('moves one source row and assigns destination order', () => {
    const card = KANBAN_SHOWCASE_ROWS[0];
    const moved = moveCard(KANBAN_SHOWCASE_ROWS, card.id, 'done');
    expect(moved.find((row) => row.id === card.id)?.status).toBe('done');
  });
});

