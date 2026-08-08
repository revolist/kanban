import { describe, expect, it } from 'vitest';
import { validateKanbanUseCaseScenario } from '../kanban-use-case-model';
import { SALES_ONBOARDING_SCENARIO } from './sales-onboarding.data';

describe('Sales and onboarding Kanban use case', () => {
  it('is a complete, internally consistent scenario', () => {
    expect(validateKanbanUseCaseScenario(SALES_ONBOARDING_SCENARIO)).toEqual([]);
  });

  it('carries account context through the full revenue-to-value journey', () => {
    expect(SALES_ONBOARDING_SCENARIO.cards).toHaveLength(16);
    expect(SALES_ONBOARDING_SCENARIO.swimlanes.map(({ id }) => id)).toEqual([
      'strategic',
      'growth',
    ]);
    expect(SALES_ONBOARDING_SCENARIO.workflowColumns.map(({ prop }) => prop)).toEqual([
      'qualified',
      'solution',
      'contract',
      'implementation',
      'live',
    ]);

    expect(SALES_ONBOARDING_SCENARIO.cards.every((card) => (
      card.assignees.includes(card.owner)
      && card.arrValue > 0
      && card.arr.startsWith('$')
      && card.solution.length > 0
      && card.implementation.length > 0
      && card.handoff.includes('→')
      && /^2026-(08|09|10)-\d{2}$/.test(card.goLiveDate)
      && card.context.includes(card.arr)
    ))).toBe(true);
    expect(SALES_ONBOARDING_SCENARIO.columns.length).toBeGreaterThanOrEqual(5);
  });

  it('makes implementation capacity and the blocked handoff explicit', () => {
    const implementationCards = SALES_ONBOARDING_SCENARIO.cards.filter(
      ({ status }) => status === 'implementation',
    );
    const strategicImplementations = implementationCards.filter(
      ({ lane }) => lane === 'strategic',
    );
    const implementationColumn = SALES_ONBOARDING_SCENARIO.workflowColumns.find(
      ({ prop }) => prop === 'implementation',
    );
    const strategicLane = SALES_ONBOARDING_SCENARIO.swimlanes.find(
      ({ id }) => id === 'strategic',
    );
    const riskCards = SALES_ONBOARDING_SCENARIO.cards.filter(({ risk }) => Boolean(risk));

    expect(implementationCards).toHaveLength(5);
    expect(implementationColumn?.wipLimit).toBe(4);
    expect(strategicImplementations).toHaveLength(3);
    expect(strategicLane?.wipLimits?.implementation).toBe(2);
    expect(SALES_ONBOARDING_SCENARIO.attention.detail).toContain('5 of 4');
    expect(riskCards).toHaveLength(1);
    expect(riskCards[0]).toMatchObject({
      id: 'REV-616',
      account: 'Lumen Energy',
      priority: 'Critical',
      handoff: 'Security → Implementation',
      risk: expect.stringContaining('data owner'),
    });
  });

  it('keeps the metrics grounded in the underlying account portfolio', () => {
    const openCards = SALES_ONBOARDING_SCENARIO.cards.filter(({ status }) => status !== 'live');
    const openArr = openCards.reduce((sum, card) => sum + card.arrValue, 0);
    const septemberImplementations = SALES_ONBOARDING_SCENARIO.cards.filter((card) => (
      card.status === 'implementation' && card.goLiveDate.startsWith('2026-09-')
    ));
    const liveCards = SALES_ONBOARDING_SCENARIO.cards.filter(({ status }) => status === 'live');

    expect(openArr).toBe(2637000);
    expect(septemberImplementations).toHaveLength(4);
    expect(liveCards).toHaveLength(3);
    expect(liveCards.every(({ progress, handoff }) => (
      progress === 100 && handoff === 'Onboarding → Customer success'
    ))).toBe(true);
  });
});
