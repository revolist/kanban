import { describe, expect, it } from 'vitest';
import { validateKanbanUseCaseScenario } from '../kanban-use-case-model';
import { PRODUCT_DELIVERY_SCENARIO } from './product-delivery.data';

describe('Product delivery Kanban use case', () => {
  it('is a complete, internally consistent scenario', () => {
    expect(validateKanbanUseCaseScenario(PRODUCT_DELIVERY_SCENARIO)).toEqual([]);
  });

  it('models a two-workstream release across the full delivery flow', () => {
    expect(PRODUCT_DELIVERY_SCENARIO.cards).toHaveLength(16);
    expect(PRODUCT_DELIVERY_SCENARIO.swimlanes.map(({ id }) => id)).toEqual(['product', 'platform']);
    expect(PRODUCT_DELIVERY_SCENARIO.workflowColumns.map(({ prop }) => prop)).toEqual([
      'discovery',
      'design',
      'build',
      'review',
      'released',
    ]);

    const totalPoints = PRODUCT_DELIVERY_SCENARIO.cards.reduce(
      (sum, card) => sum + card.storyPoints,
      0,
    );
    expect(totalPoints).toBe(76);
    expect(PRODUCT_DELIVERY_SCENARIO.cards.every((card) => card.assignees.includes(card.owner))).toBe(true);
    expect(PRODUCT_DELIVERY_SCENARIO.cards.every((card) => card.context.includes(`${card.storyPoints} pts`))).toBe(true);
    expect(PRODUCT_DELIVERY_SCENARIO.cards.every((card) => card.handoff.includes('→'))).toBe(true);
  });

  it('makes the constrained build queue and customer-facing release risk explicit', () => {
    const buildCards = PRODUCT_DELIVERY_SCENARIO.cards.filter(({ status }) => status === 'build');
    const platformBuildCards = buildCards.filter(({ lane }) => lane === 'platform');
    const buildColumn = PRODUCT_DELIVERY_SCENARIO.workflowColumns.find(({ prop }) => prop === 'build');
    const platformLane = PRODUCT_DELIVERY_SCENARIO.swimlanes.find(({ id }) => id === 'platform');

    expect(buildCards).toHaveLength(5);
    expect(buildColumn?.wipLimit).toBe(4);
    expect(platformBuildCards).toHaveLength(3);
    expect(platformLane?.wipLimits?.build).toBe(2);
    expect(PRODUCT_DELIVERY_SCENARIO.attention.detail).toContain('5 of 4');
    expect(PRODUCT_DELIVERY_SCENARIO.cards.find(({ id }) => id === 'PLAT-118')).toMatchObject({
      priority: 'Critical',
      risk: expect.stringContaining('error budget'),
      release: 'R26.9',
    });
  });

  it('keeps released work fully complete and future work tied to the target release', () => {
    const released = PRODUCT_DELIVERY_SCENARIO.cards.filter(({ status }) => status === 'released');
    const targetRelease = PRODUCT_DELIVERY_SCENARIO.cards.filter(({ release }) => release === 'R26.9');

    expect(released).toHaveLength(2);
    expect(released.every(({ progress, release }) => progress === 100 && release === 'R26.8')).toBe(true);
    expect(targetRelease).toHaveLength(14);
    expect(PRODUCT_DELIVERY_SCENARIO.columns.length).toBeGreaterThanOrEqual(5);
  });
});
