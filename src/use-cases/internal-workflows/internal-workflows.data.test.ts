import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateKanbanUseCaseScenario } from '../kanban-use-case-model';
import { INTERNAL_WORKFLOWS_SCENARIO } from './internal-workflows.data';

describe('Internal workflows Kanban use case', () => {
  it('is a complete, internally consistent scenario', () => {
    expect(validateKanbanUseCaseScenario(INTERNAL_WORKFLOWS_SCENARIO)).toEqual([]);
  });

  it('models two operational lanes across the full request lifecycle', () => {
    expect(INTERNAL_WORKFLOWS_SCENARIO.cards).toHaveLength(16);
    expect(INTERNAL_WORKFLOWS_SCENARIO.swimlanes.map(({ id }) => id)).toEqual([
      'business-operations',
      'people-technology',
    ]);
    expect(INTERNAL_WORKFLOWS_SCENARIO.workflowColumns.map(({ prop }) => prop)).toEqual([
      'intake',
      'assigned',
      'approval',
      'fulfillment',
      'complete',
    ]);

    expect(INTERNAL_WORKFLOWS_SCENARIO.cards.every((card) => (
      card.assignees.includes(card.owner)
      && card.requester.length > 0
      && card.owner.length > 0
      && card.department.length > 0
      && card.approval.length > 0
      && card.requestValue.length > 0
      && card.dueDate.length > 0
      && card.handoff.includes('→')
      && card.context.includes(card.department)
      && card.context.includes(card.requester)
    ))).toBe(true);
    expect(INTERNAL_WORKFLOWS_SCENARIO.columns.length).toBeGreaterThanOrEqual(5);
  });

  it('covers finance, compliance, hiring, procurement, and IT requests', () => {
    const departments = [...new Set(
      INTERNAL_WORKFLOWS_SCENARIO.cards.map(({ department }) => department),
    )].sort();

    expect(departments).toEqual([
      'Compliance',
      'Finance',
      'Hiring',
      'IT',
      'Procurement',
    ]);
  });

  it('makes the approval bottleneck and same-day payment risk explicit', () => {
    const approvals = INTERNAL_WORKFLOWS_SCENARIO.cards.filter(
      ({ status }) => status === 'approval',
    );
    const businessApprovals = approvals.filter(
      ({ lane }) => lane === 'business-operations',
    );
    const approvalColumn = INTERNAL_WORKFLOWS_SCENARIO.workflowColumns.find(
      ({ prop }) => prop === 'approval',
    );
    const businessLane = INTERNAL_WORKFLOWS_SCENARIO.swimlanes.find(
      ({ id }) => id === 'business-operations',
    );
    const risks = INTERNAL_WORKFLOWS_SCENARIO.cards.filter(({ risk }) => Boolean(risk));

    expect(approvals).toHaveLength(5);
    expect(approvalColumn?.wipLimit).toBe(4);
    expect(businessApprovals).toHaveLength(3);
    expect(businessLane?.wipLimits?.approval).toBe(2);
    expect(INTERNAL_WORKFLOWS_SCENARIO.attention.detail).toContain('5 of 4');
    expect(risks).toHaveLength(1);
    expect(risks[0]).toMatchObject({
      id: 'IW-204',
      department: 'Finance',
      priority: 'Critical',
      approval: 'CFO approval',
      requestValue: '$186k invoice',
      dueDate: 'Aug 7 · 15:00',
      risk: expect.stringContaining('service'),
    });
  });

  it('keeps workload metrics grounded in the request records', () => {
    const open = INTERNAL_WORKFLOWS_SCENARIO.cards.filter(
      ({ status }) => status !== 'complete',
    );
    const complete = INTERNAL_WORKFLOWS_SCENARIO.cards.filter(
      ({ status }) => status === 'complete',
    );

    expect(open).toHaveLength(14);
    expect(complete).toHaveLength(2);
    expect(complete.every(({ progress, approval }) => (
      progress === 100 && approval.startsWith('Approved')
    ))).toBe(true);
  });

  it('uses the numbered process-blueprint presentation in every framework', () => {
    const fixturePath = (...parts: string[]) => resolve(
      process.cwd(),
      'src',
      'use-cases',
      'internal-workflows',
      ...parts,
    );
    const styles = readFileSync(fixturePath('internal-workflows.scss'), 'utf8');

    expect(styles).toContain('counter-reset: internal-stage');
    expect(styles).toContain('counter(internal-stage, decimal-leading-zero)');
    expect(styles).toContain('.kanban-use-case-column-dot--approval');
    expect(styles).toContain('.kanban-use-case-column-dot--fulfillment');
    expect(styles).toContain('.kanban-stack__empty');

    for (const entry of [
      'internal-workflows.ts',
      'internal-workflows.vue',
      'internal-workflows.react.tsx',
      'internal-workflows.angular.ts',
    ]) {
      const source = readFileSync(fixturePath(entry), 'utf8');
      expect(source).toContain("import './internal-workflows.scss';");
    }
  });
});
