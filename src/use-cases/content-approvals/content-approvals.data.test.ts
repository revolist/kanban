import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateKanbanUseCaseScenario } from '../kanban-use-case-model';
import { CONTENT_APPROVALS_SCENARIO } from './content-approvals.data';

describe('Content and approvals Kanban use case', () => {
  const styles = readFileSync(
    resolve(process.cwd(), 'src/use-cases/content-approvals/content-approvals.scss'),
    'utf8',
  );

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

  it('keeps every editorial headline, workflow state, and footer inside the card', () => {
    expect(CONTENT_APPROVALS_SCENARIO.layout.cardRowHeight).toBe(286);
    expect(CONTENT_APPROVALS_SCENARIO.useSwimlanes).toBe(false);
    expect('showDropTargets' in CONTENT_APPROVALS_SCENARIO).toBe(false);
    expect(styles).toMatch(/grid-template-rows:\s*24px 50px 24px 52px 24px 22px/);
    expect(styles).toMatch(/\.kanban-column-header__title[\s\S]*?font-size:\s*18px/);
    expect(styles).toMatch(/\.kanban-card\s*\{[\s\S]*?overflow:\s*hidden/);
    expect(styles).toMatch(/card-content--editorial-approval \.kanban-use-case-card-title[\s\S]*?-webkit-line-clamp:\s*2/);
    expect(styles).toMatch(/card-content--editorial-approval \.kanban-use-case-card-title[\s\S]*?white-space:\s*normal/);
    expect(styles).toMatch(/\.kanban-use-case-editorial-proof\s*\{/);
    expect(styles).toMatch(/\.kanban-use-case-editorial-footer\s*\{/);
    expect(styles).toMatch(/\.kanban-use-case-card--risk[\s\S]*?border-inline-start:\s*4px solid/);
    expect(styles).toMatch(/\.kanban-column-header__toggle svg[\s\S]*?width:\s*14px[\s\S]*?height:\s*14px/);
    expect(styles).toContain('--revo-grid-header-height: 66px');
    expect(styles).toMatch(/\.kanban-column-header\s*\{[^}]*min-height:\s*66px;/s);
    expect(styles).toMatch(/\.kanban-column-header__count\s*\{[^}]*display:\s*inline-flex !important;[^}]*align-items:\s*center;/s);
    expect(styles).toMatch(/\.kanban-column-header__toggle\s*\{[^}]*width:\s*32px;[^}]*height:\s*32px;[^}]*place-items:\s*center;/s);

    const fontWeights = [...styles.matchAll(/font-weight:\s*(\d+)/g)]
      .map(([, weight]) => Number(weight));
    expect(fontWeights.every((weight) => weight <= 500)).toBe(true);
  });
});
