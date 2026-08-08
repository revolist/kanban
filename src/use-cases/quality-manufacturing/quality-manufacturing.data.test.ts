import { describe, expect, it } from 'vitest';
import { validateKanbanUseCaseScenario } from '../kanban-use-case-model';
import { QUALITY_MANUFACTURING_SCENARIO } from './quality-manufacturing.data';

describe('Quality and manufacturing Kanban use case', () => {
  it('is a complete, internally consistent scenario', () => {
    expect(validateKanbanUseCaseScenario(QUALITY_MANUFACTURING_SCENARIO)).toEqual([]);
  });

  it('keeps production work traceable from detection through closure', () => {
    expect(QUALITY_MANUFACTURING_SCENARIO.cards).toHaveLength(16);
    expect(QUALITY_MANUFACTURING_SCENARIO.swimlanes.map(({ id }) => id)).toEqual([
      'line-a',
      'line-b',
    ]);
    expect(QUALITY_MANUFACTURING_SCENARIO.workflowColumns.map(({ prop }) => prop)).toEqual([
      'detected',
      'containment',
      'capa',
      'verification',
      'closed',
    ]);

    expect(QUALITY_MANUFACTURING_SCENARIO.cards.every((card) => (
      card.assignees.includes(card.owner)
      && card.workOrder.startsWith('WO-')
      && card.defect.length > 0
      && card.machine.length > 0
      && card.material.length > 0
      && card.lot.length > 0
      && card.inspection.length > 0
      && card.handoff.includes('→')
      && card.context.includes(card.workOrder)
    ))).toBe(true);
    expect(QUALITY_MANUFACTURING_SCENARIO.columns.length).toBeGreaterThanOrEqual(5);
  });

  it('makes the containment bottleneck and material exposure explicit', () => {
    const containment = QUALITY_MANUFACTURING_SCENARIO.cards.filter(
      ({ status }) => status === 'containment',
    );
    const lineBContainment = containment.filter(({ lane }) => lane === 'line-b');
    const containmentColumn = QUALITY_MANUFACTURING_SCENARIO.workflowColumns.find(
      ({ prop }) => prop === 'containment',
    );
    const lineB = QUALITY_MANUFACTURING_SCENARIO.swimlanes.find(({ id }) => id === 'line-b');

    expect(containment).toHaveLength(4);
    expect(containmentColumn?.wipLimit).toBe(3);
    expect(lineBContainment).toHaveLength(3);
    expect(lineB?.wipLimits?.containment).toBe(2);
    expect(QUALITY_MANUFACTURING_SCENARIO.attention.detail).toContain('4 of 3');
    expect(QUALITY_MANUFACTURING_SCENARIO.attention.detail).toContain('1,240 units');
    expect(QUALITY_MANUFACTURING_SCENARIO.cards.find(({ id }) => id === 'QM-7315')).toMatchObject({
      workOrder: 'WO-48635',
      lot: 'CAP-260805-17',
      severity: 'Critical',
      priority: 'Critical',
      unitsHeld: 1240,
      inspection: 'Incoming AQL',
      risk: expect.stringContaining('sort-or-return'),
    });
  });

  it('uses verification evidence before a quality case is closed', () => {
    const verification = QUALITY_MANUFACTURING_SCENARIO.cards.filter(
      ({ status }) => status === 'verification',
    );
    const closed = QUALITY_MANUFACTURING_SCENARIO.cards.filter(({ status }) => status === 'closed');

    expect(verification).toHaveLength(3);
    expect(verification.every(({ progress, inspection }) => progress >= 80 && inspection.length > 0)).toBe(true);
    expect(closed).toHaveLength(4);
    expect(closed.every(({ progress, unitsHeld }) => progress === 100 && unitsHeld === 0)).toBe(true);
  });
});
