import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createKanbanUseCaseConfig,
  kanbanUseCaseCardUsesProgress,
  kanbanUseCaseUsesProgress,
  validateKanbanUseCaseScenario,
  type KanbanUseCaseCardPresentation,
  type KanbanUseCaseScenario,
} from './kanban-use-case-model';
import { CONTENT_APPROVALS_SCENARIO } from './content-approvals/content-approvals.data';
import { INTERNAL_WORKFLOWS_SCENARIO } from './internal-workflows/internal-workflows.data';
import { PRODUCT_DELIVERY_SCENARIO } from './product-delivery/product-delivery.data';
import { QUALITY_MANUFACTURING_SCENARIO } from './quality-manufacturing/quality-manufacturing.data';
import { SALES_ONBOARDING_SCENARIO } from './sales-onboarding/sales-onboarding.data';
import { SUPPORT_OPERATIONS_SCENARIO } from './support-operations/support-operations.data';

function scenario(overrides: Partial<KanbanUseCaseScenario> = {}): KanbanUseCaseScenario {
  const cards = Array.from({ length: 12 }, (_, index) => ({
    id: `CARD-${index}`,
    title: `Card ${index}`,
    description: 'A production-shaped workflow record.',
    status: ['queue', 'active', 'review', 'done'][index % 4]!,
    lane: ['lane-a', 'lane-b'][index % 2]!,
    owner: 'Owner',
    assignees: ['Owner'],
    priority: index === 0 ? 'High' as const : 'Medium' as const,
    label: 'Work',
    progress: 20,
    dueDate: 'Aug 12',
    order: Math.floor(index / 8) * 1000 + Math.floor(index / 4) * 100 + index,
  }));

  return {
    id: 'example',
    cardPresentation: 'delivery',
    useSwimlanes: true,
    layout: { cardRowHeight: 210, swimlaneWidth: 168, collapsedSwimlaneWidth: 44 },
    eyebrow: 'Example workflow',
    title: 'Example board',
    description: 'A complete board.',
    attention: { label: 'On track', detail: 'No blockers', tone: 'good' },
    metrics: [
      { label: 'One', value: '1' },
      { label: 'Two', value: '2' },
      { label: 'Three', value: '3' },
    ],
    cards,
    columns: Array.from({ length: 5 }, (_, index) => ({ prop: `field-${index}` })),
    workflowColumns: [
      { prop: 'queue', name: 'Queue' },
      { prop: 'active', name: 'Active' },
      { prop: 'review', name: 'Review' },
      { prop: 'done', name: 'Done' },
    ],
    swimlanes: [
      { id: 'lane-a', title: 'Lane A' },
      { id: 'lane-b', title: 'Lane B' },
    ],
    ...overrides,
  };
}

describe('Kanban use-case scenarios', () => {
  it('keeps product-delivery content compact and reserves complete badge space', () => {
    const styles = readFileSync(
      resolve(process.cwd(), 'src', 'use-cases', 'kanban-use-case-demo.scss'),
      'utf8',
    );

    expect(styles).toMatch(/\.kanban-use-case-card-content--delivery\s*\{[^}]*align-content:\s*start;/s);
    expect(styles).toMatch(/\.kanban-use-case-card-content--delivery \.kanban-use-case-card-topline\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto auto;/s);
    expect(styles).toMatch(/\.kanban-use-case-card-content--delivery \.kanban-use-case-priority\s*\{[^}]*flex:\s*0 0 auto;/s);
  });

  it('gives every showcase a distinct card presentation and limits progress to delivery work', () => {
    const showcases = [
      PRODUCT_DELIVERY_SCENARIO,
      SUPPORT_OPERATIONS_SCENARIO,
      SALES_ONBOARDING_SCENARIO,
      CONTENT_APPROVALS_SCENARIO,
      QUALITY_MANUFACTURING_SCENARIO,
      INTERNAL_WORKFLOWS_SCENARIO,
    ];

    expect(showcases.map(({ cardPresentation }) => cardPresentation)).toEqual([
      'delivery',
      'support-ticket',
      'revenue-opportunity',
      'editorial-approval',
      'quality-inspection',
      'internal-request',
    ]);
    expect(new Set(showcases.map(({ cardPresentation }) => cardPresentation))).toHaveLength(6);
    expect(showcases.map(({ useSwimlanes }) => useSwimlanes)).toEqual([
      true,
      true,
      false,
      false,
      true,
      false,
    ]);
    expect(showcases.map(({ swimlaneLayout }) => swimlaneLayout)).toEqual([
      'top',
      'top',
      undefined,
      undefined,
      'column',
      undefined,
    ]);
    expect(showcases.filter(({ showDropTargets }) => showDropTargets).map(({ id }) => id)).toEqual([
      'internal-workflows',
    ]);
    expect(createKanbanUseCaseConfig(PRODUCT_DELIVERY_SCENARIO).swimlaneColumn).toBe(false);
    expect(createKanbanUseCaseConfig(SUPPORT_OPERATIONS_SCENARIO).swimlaneColumn).toBe(false);
    expect(createKanbanUseCaseConfig(QUALITY_MANUFACTURING_SCENARIO).swimlaneColumn).not.toBe(false);
    expect(createKanbanUseCaseConfig(SALES_ONBOARDING_SCENARIO).swimlaneColumn).toBe(false);
    expect(showcases.map(({ cardPresentation }) => kanbanUseCaseUsesProgress(cardPresentation))).toEqual([
      true,
      false,
      false,
      false,
      false,
      false,
    ]);

    for (const current of showcases) {
      expect(current.layout.cardRowHeight).toBeGreaterThanOrEqual(190);
      expect(current.layout.swimlaneWidth).toBeGreaterThanOrEqual(160);
      expect(current.layout.collapsedSwimlaneWidth).toBeGreaterThanOrEqual(40);
    }
  });

  it('uses actual risk state instead of painting every high-priority card red', () => {
    const config = createKanbanUseCaseConfig(scenario());
    const rules = config.cardRules ?? [];
    const highPriorityCard = scenario().cards[0]!;
    const riskCard = { ...highPriorityCard, risk: 'Release blocker' };

    expect(rules).toHaveLength(1);
    expect(rules[0]!.when({ card: highPriorityCard } as never)).toBe(false);
    expect(rules[0]!.when({ card: riskCard } as never)).toBe(true);
    expect(rules[0]!.result.style).toBeUndefined();
  });

  it('renders presentation-specific card roots and limits progress to delivery build cards', () => {
    type TestNode = {
      props?: { class?: string };
      children?: unknown;
    };
    const presentations: KanbanUseCaseCardPresentation[] = [
      'delivery',
      'support-ticket',
      'revenue-opportunity',
      'editorial-approval',
      'quality-inspection',
      'internal-request',
    ];
    const classes = (node: unknown): string[] => {
      if (!node || typeof node !== 'object') return [];
      if (Array.isArray(node)) return node.flatMap(classes);
      const current = node as TestNode;
      return [current.props?.class ?? '', ...classes(current.children)].filter(Boolean);
    };
    const h = (_tag: string, props?: TestNode['props'], children?: unknown): TestNode => ({ props, children });

    for (const cardPresentation of presentations) {
      const current = scenario({ cardPresentation });
      const renderer = createKanbanUseCaseConfig(current).customization?.cardContent;
      const rendered = (renderer as unknown as (
        hyperscript: typeof h,
        context: { card: (typeof current.cards)[number] },
      ) => TestNode)(h, { card: current.cards[0]! });
      const renderedClasses = classes(rendered).join(' ');

      expect(renderedClasses).toContain(`kanban-use-case-card-content--${cardPresentation}`);
      expect(renderedClasses).not.toContain('kanban-use-case-progress');
    }

    const delivery = scenario({ cardPresentation: 'delivery' });
    const renderer = createKanbanUseCaseConfig(delivery).customization?.cardContent;
    const buildCard = { ...delivery.cards[0]!, status: 'build' };
    const rendered = (renderer as unknown as (
      hyperscript: typeof h,
      context: { card: typeof buildCard },
    ) => TestNode)(h, { card: buildCard });

    expect(classes(rendered).join(' ')).toContain('kanban-use-case-progress');
    expect(kanbanUseCaseCardUsesProgress('delivery', 'discovery')).toBe(false);
    expect(kanbanUseCaseCardUsesProgress('delivery', 'build')).toBe(true);
    expect(kanbanUseCaseCardUsesProgress('support-ticket', 'build')).toBe(false);
  });

  it('exposes semantic severity classes and revenue decision language to showcase styles', () => {
    type TestNode = { props?: { class?: string }; children?: unknown };
    const h = (_tag: string, props?: TestNode['props'], children?: unknown): TestNode => ({ props, children });
    const classes = (node: unknown): string[] => {
      if (!node || typeof node !== 'object') return [];
      if (Array.isArray(node)) return node.flatMap(classes);
      const current = node as TestNode;
      return [current.props?.class ?? '', ...classes(current.children)].filter(Boolean);
    };
    const quality = scenario({ cardPresentation: 'quality-inspection' });
    const qualityCard = { ...quality.cards[0]!, severity: 'Critical' };
    const qualityRendered = createKanbanUseCaseConfig(quality).customization?.cardContent?.(h as never, { card: qualityCard } as never);

    expect(classes(qualityRendered).join(' ')).toContain('kanban-use-case-card-content--severity-critical');

    const revenue = scenario({ cardPresentation: 'revenue-opportunity' });
    const revenueCard = { ...revenue.cards[0]!, status: 'qualified', account: 'Atlas Health', arr: '$320k', lane: 'Strategic' };
    const revenueRendered = createKanbanUseCaseConfig(revenue).customization?.cardContent?.(h as never, { card: revenueCard } as never);
    expect(JSON.stringify(revenueRendered)).toContain('Next decision');
  });

  it('accepts a complete scenario', () => {
    expect(validateKanbanUseCaseScenario(scenario())).toEqual([]);
  });

  it('reports invalid identity, workflow, lane, progress, and order values', () => {
    const base = scenario();
    const cards = [...base.cards];
    cards[1] = {
      ...cards[1]!,
      id: cards[0]!.id,
      status: 'missing',
      lane: 'missing',
      progress: 140,
      order: cards[0]!.order,
    };

    expect(validateKanbanUseCaseScenario({ ...base, cards })).toEqual(expect.arrayContaining([
      'duplicate card id: CARD-0',
      'card CARD-0 references missing workflow column missing',
      'card CARD-0 references missing swimlane missing',
      'card CARD-0 has invalid progress 140',
    ]));
  });
});
