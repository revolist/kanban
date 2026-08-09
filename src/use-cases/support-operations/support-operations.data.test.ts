import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateKanbanUseCaseScenario } from '../kanban-use-case-model';
import { SUPPORT_OPERATIONS_SCENARIO } from './support-operations.data';

describe('Support operations Kanban use case', () => {
  it('is a complete, internally consistent scenario', () => {
    expect(validateKanbanUseCaseScenario(SUPPORT_OPERATIONS_SCENARIO)).toEqual([]);
    expect(SUPPORT_OPERATIONS_SCENARIO).toMatchObject({
      colorScheme: 'dark',
      cardPresentation: 'support-ticket',
      swimlaneLayout: 'top',
    });
  });

  it('models two support teams across the full service workflow', () => {
    expect(SUPPORT_OPERATIONS_SCENARIO.cards).toHaveLength(16);
    expect(SUPPORT_OPERATIONS_SCENARIO.swimlanes.map(({ id }) => id)).toEqual([
      'enterprise',
      'digital',
    ]);
    expect(SUPPORT_OPERATIONS_SCENARIO.workflowColumns.map(({ prop }) => prop)).toEqual([
      'new',
      'triage',
      'investigating',
      'waiting-on-customer',
      'resolved',
    ]);

    expect(SUPPORT_OPERATIONS_SCENARIO.cards.every((card) => (
      card.assignees.includes(card.owner)
      && card.account.length > 0
      && card.slaTarget.length > 0
      && card.channel.length > 0
      && card.escalation.length > 0
      && card.handoff.includes('→')
      && card.context.includes(card.account)
    ))).toBe(true);
    expect(SUPPORT_OPERATIONS_SCENARIO.columns.length).toBeGreaterThanOrEqual(5);
  });

  it('keeps incident-command headers separate from full-height ticket rows', () => {
    expect(SUPPORT_OPERATIONS_SCENARIO.headerIcons).toEqual({
      new: 'file-circle-plus',
      triage: 'wave-square',
      investigating: 'magnifying-glass',
      'waiting-on-customer': 'message',
      resolved: 'check-circle',
    });
    expect(SUPPORT_OPERATIONS_SCENARIO.workflowColumns.every(({ prop }) => (
      SUPPORT_OPERATIONS_SCENARIO.headerIcons?.[String(prop)]
    ))).toBe(true);
    expect(SUPPORT_OPERATIONS_SCENARIO.useSwimlanes).toBe(false);
    expect(SUPPORT_OPERATIONS_SCENARIO.layout.cardRowHeight).toBe(266);
    expect(SUPPORT_OPERATIONS_SCENARIO.swimlanes.every(({ height }) => height === undefined)).toBe(true);
    expect(SUPPORT_OPERATIONS_SCENARIO.showDropTargets).not.toBe(true);

    const styles = readFileSync(resolve(
      process.cwd(),
      'src',
      'use-cases',
      'support-operations',
      'support-operations.scss',
    ), 'utf8');
    expect(styles).not.toContain("content: 'WORKSTREAM\\A Enterprise support'");
    expect(styles).toMatch(/\.kanban-column-header-cell\s*\{[^}]*translate:\s*none;/s);
    expect(styles).toMatch(/\.kanban-board-cell:not\(\.kanban-board-cell--lane-header-row\)\s*\{[^}]*translate:\s*none;/s);
  });

  it('makes the investigation bottleneck and urgent P1 risk explicit', () => {
    const investigations = SUPPORT_OPERATIONS_SCENARIO.cards.filter(
      ({ status }) => status === 'investigating',
    );
    const enterpriseInvestigations = investigations.filter(({ lane }) => lane === 'enterprise');
    const investigationColumn = SUPPORT_OPERATIONS_SCENARIO.workflowColumns.find(
      ({ prop }) => prop === 'investigating',
    );
    const enterpriseLane = SUPPORT_OPERATIONS_SCENARIO.swimlanes.find(
      ({ id }) => id === 'enterprise',
    );

    expect(investigations).toHaveLength(5);
    expect(investigationColumn?.wipLimit).toBe(4);
    expect(enterpriseInvestigations).toHaveLength(3);
    expect(enterpriseLane?.wipLimits?.investigating).toBe(2);
    expect(SUPPORT_OPERATIONS_SCENARIO.attention.detail).toContain('5 of 4');
    expect(SUPPORT_OPERATIONS_SCENARIO.cards.find(({ id }) => id === 'SO-8421')).toMatchObject({
      account: 'RetailCloud',
      severity: 'P1',
      priority: 'Critical',
      slaState: '42m left',
      escalation: 'Incident commander',
      risk: expect.stringContaining('42 minutes'),
    });
  });

  it('keeps customer-waiting work paused and resolved cases trustworthy', () => {
    const waiting = SUPPORT_OPERATIONS_SCENARIO.cards.filter(
      ({ status }) => status === 'waiting-on-customer',
    );
    const resolved = SUPPORT_OPERATIONS_SCENARIO.cards.filter(({ status }) => status === 'resolved');

    expect(waiting).toHaveLength(3);
    expect(waiting.every(({ slaState, slaTarget }) => (
      slaState === 'Clock paused' && slaTarget === 'Paused for customer'
    ))).toBe(true);
    expect(resolved).toHaveLength(2);
    expect(resolved.every(({ progress, slaState }) => (
      progress === 100 && slaState.startsWith('Met')
    ))).toBe(true);
  });
});
