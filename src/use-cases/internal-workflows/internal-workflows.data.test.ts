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
      expect(source).not.toContain('@phosphor-icons');
    }

    expect(styles).toContain('@fortawesome/fontawesome-free/svgs/solid/download.svg');
  });

  it('locks the polished tapered rail and compact card geometry', () => {
    expect(INTERNAL_WORKFLOWS_SCENARIO.useSwimlanes).toBe(false);
    expect(INTERNAL_WORKFLOWS_SCENARIO.allowColumnMove).toBe(false);
    expect(INTERNAL_WORKFLOWS_SCENARIO.workflowColumns.map(({ size }) => size)).toEqual([
      351,
      341,
      343,
      315,
      322,
    ]);
    expect(INTERNAL_WORKFLOWS_SCENARIO.layout.cardRowHeight).toBe(252);

    const styles = readFileSync(resolve(
      process.cwd(),
      'src',
      'use-cases',
      'internal-workflows',
      'internal-workflows.scss',
    ), 'utf8');

    expect(styles).toContain('--internal-header-height: 60px');
    expect(styles).toContain('--internal-step-size: 35px');
    expect(styles).toContain('--internal-connector-size: 12px');
    expect(styles).toContain('--internal-card-gap: 8px');
    expect(styles).toMatch(/\.kanban-use-case-shell--internal-workflows\s*\{[^}]*overflow:\s*hidden;/s);
    expect(styles).toMatch(/\.kanban-use-case-grid\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*0;[^}]*flex:\s*1 1 auto;/s);
    expect(styles).not.toContain('width: 1672px');
    expect(styles).toContain('height: 100%');
    expect(styles).not.toContain('zoom:');
    expect(styles).toContain('clip-path: polygon(');
    expect(styles).toMatch(/\.kanban-column-header-cell:nth-of-type\(n \+ 2\)\s*\{[^}]*padding-left:\s*0\s*!important;/s);
    expect(styles).toMatch(/\.kanban-column-header-cell:nth-of-type\(1\)\s*\{[^}]*z-index:\s*5;/s);
    expect(styles).toMatch(/\.kanban-column-header-cell:nth-of-type\(5\)\s*\{[^}]*z-index:\s*1;/s);
    expect(styles).toMatch(/\.kanban-column-header-cell:not\(:nth-of-type\(5\)\)::before\s*\{[^}]*right:\s*-14px;[^}]*width:\s*14px;[^}]*height:\s*var\(--internal-header-height\);[^}]*clip-path:\s*polygon\(0 0, 100% 50%, 0 100%\);[^}]*background:\s*var\(--internal-stage\)\s*!important;/s);
    expect(styles).toContain('--internal-separator-color: #f7fafc');
    expect(styles).toMatch(/data-kanban-column-prop="assigned"\],[\s\S]*?data-kanban-column-prop="fulfillment"\]\s*\{[^}]*width:\s*calc\(100% \+ 6px\);[^}]*margin-left:\s*8px;/s);
    expect(styles).toMatch(/data-kanban-column-prop="complete"\]\s*\{[^}]*width:\s*calc\(100% - 26px\);[^}]*margin-left:\s*8px;/s);
    expect(styles).not.toMatch(/\.kanban-column-header-cell:not\(:nth-of-type\(5\)\)::before\s*\{[^}]*filter:/s);
    expect(styles).toMatch(/\.kanban-column-header-cell:not\(:nth-of-type\(5\)\)::after\s*\{[^}]*display:\s*block;[^}]*width:\s*var\(--internal-connector-size\);[^}]*height:\s*var\(--internal-connector-size\);/s);
    expect(styles).toMatch(/data-kanban-column-prop="assigned"\][^{]*::before,[\s\S]*?data-kanban-column-prop="complete"\][^{]*::before\s*\{[^}]*left:\s*24px;/s);
    expect(styles).not.toContain('.kanban-column-header[data-kanban-column-prop]::after {\n  display: none !important;');
    expect(styles).toContain('grid-template-rows: 18px 40px 20px 40px 50px 22px');
    expect(styles).toMatch(/data-kanban-column-prop\]::before\s*\{[^}]*width:\s*var\(--internal-step-size\);[^}]*height:\s*var\(--internal-step-size\);/s);
    expect(styles).toMatch(/\.kanban-column-header__count,[\s\S]*?\.kanban-column-header__wip\s*\{[^}]*display:\s*inline-flex;[^}]*height:\s*26px;[^}]*align-items:\s*center;/s);
    expect(styles).toMatch(/\.kanban-card\s*\{[^}]*border-top:\s*3px solid var\(--internal-stage\) !important;/s);

    const weights = [...styles.matchAll(/font-weight:\s*(\d+)/g)]
      .map(([, weight]) => Number(weight));
    expect(Math.max(...weights)).toBeLessThanOrEqual(500);
  });

  it('keeps every compact request card and drop target inside its stage well', () => {
    const styles = readFileSync(resolve(
      process.cwd(),
      'src',
      'use-cases',
      'internal-workflows',
      'internal-workflows.scss',
    ), 'utf8');

    expect(styles).toContain('--internal-card-height: 246px');
    expect(styles).toMatch(/\.kanban-stack\s*\{[^}]*padding:\s*10px\s*!important;/s);
    expect(styles).not.toContain('padding: 10px 0 10px 30px');
    expect(styles).toMatch(/\.kanban-card\s*\{[^}]*overflow:\s*hidden;/s);
    expect(styles).toContain('text-overflow: ellipsis');
  });
});
