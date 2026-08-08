import { describe, expect, it } from 'vitest';
import { validateKanbanUseCaseScenario } from '../kanban-use-case-model';
import { CONTENT_APPROVALS_SCENARIO } from './content-approvals.data';

describe('Content and approvals Kanban use case', () => {
  it('is a complete, internally consistent scenario', () => {
    expect(validateKanbanUseCaseScenario(CONTENT_APPROVALS_SCENARIO)).toEqual([]);
  });

  it('models campaign and education content across the complete workflow', () => {
    expect(CONTENT_APPROVALS_SCENARIO.cards).toHaveLength(16);
    expect(CONTENT_APPROVALS_SCENARIO.swimlanes.map(({ id }) => id)).toEqual(['campaigns', 'education']);
    expect(CONTENT_APPROVALS_SCENARIO.workflowColumns.map(({ prop }) => prop)).toEqual([
      'briefed',
      'creating',
      'editorial',
      'approval',
      'publish',
    ]);

    expect(CONTENT_APPROVALS_SCENARIO.cards.every((card) => card.assignees.includes(card.owner))).toBe(true);
    expect(CONTENT_APPROVALS_SCENARIO.cards.every((card) => /^2026-(08|09)-\d{2}$/.test(card.publishDate))).toBe(true);
    expect(CONTENT_APPROVALS_SCENARIO.cards.every((card) => card.context.includes(card.channel))).toBe(true);
    expect(CONTENT_APPROVALS_SCENARIO.cards.every((card) => card.context.includes(card.locale))).toBe(true);
    expect(CONTENT_APPROVALS_SCENARIO.cards.every((card) => card.handoff.includes('→'))).toBe(true);
  });

  it('surfaces the overloaded approval queue and launch deadline risk', () => {
    const approvalCards = CONTENT_APPROVALS_SCENARIO.cards.filter(({ status }) => status === 'approval');
    const campaignApprovals = approvalCards.filter(({ lane }) => lane === 'campaigns');
    const approvalColumn = CONTENT_APPROVALS_SCENARIO.workflowColumns.find(({ prop }) => prop === 'approval');
    const campaignLane = CONTENT_APPROVALS_SCENARIO.swimlanes.find(({ id }) => id === 'campaigns');

    expect(approvalCards).toHaveLength(4);
    expect(approvalColumn?.wipLimit).toBe(3);
    expect(campaignApprovals).toHaveLength(2);
    expect(campaignLane?.wipLimits?.approval).toBe(1);
    expect(CONTENT_APPROVALS_SCENARIO.attention.detail).toContain('French pricing page');
    expect(CONTENT_APPROVALS_SCENARIO.cards.find(({ id }) => id === 'CA-312')).toMatchObject({
      priority: 'Critical',
      locale: 'fr-FR',
      legalReviewer: 'Dana Cole',
      publishDate: '2026-09-02',
      risk: expect.stringContaining('launch day'),
    });
  });

  it('distinguishes scheduled content from content already live', () => {
    const publishCards = CONTENT_APPROVALS_SCENARIO.cards.filter(({ status }) => status === 'publish');
    const scheduled = publishCards.filter(({ publishState }) => publishState === 'Scheduled');
    const live = publishCards.filter(({ publishState }) => publishState === 'Live');

    expect(publishCards).toHaveLength(4);
    expect(scheduled).toHaveLength(2);
    expect(live).toHaveLength(2);
    expect(live.every(({ progress }) => progress === 100)).toBe(true);
    expect(CONTENT_APPROVALS_SCENARIO.columns.length).toBeGreaterThanOrEqual(5);
  });
});
