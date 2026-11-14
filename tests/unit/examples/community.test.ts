import { describe, expect, it } from 'vitest';
import { KanbanPlugin } from '@revolist/kanban-community';
import { createCommunitySession, communityLanguage } from '../../../src/examples/community/community.shared';
import { resolveKanbanExample } from '../../../src/examples';
describe('Community example', () => {
  it('registers all four public-package framework variants', () => {
    const example = resolveKanbanExample('?example=community');
    expect(example.id).toBe('community');
    expect(example.angularSelector).toBe('kanban-community-grid');
    for (const loader of [example.loadTs, example.loadReact, example.loadVue, example.loadAngular]) {
      expect(loader).toBeTypeOf('function');
    }
  });
  it('saves canonical records rather than presentation rows and preserves unknown metadata', async () => {
    const session = createCommunitySession();
    const canonical = structuredClone(session.source);
    canonical[0].metadata = { owner: 'Host application' };
    const board = Object.assign(Object.create(KanbanPlugin.prototype), { getCards: () => canonical });
    const grid = {
      isConnected: true,
      source: [{ __kanbanCommunityIndex: 0 }],
      componentOnReady: async () => {},
      getPlugins: async () => [board],
    } as unknown as HTMLRevoGridElement;
    expect(await session.save(grid)).toBe(session.labels.saved);
    canonical[0].title = 'Changed after save';
    expect(session.load(grid)).toBe(session.labels.loaded);
    expect(grid.source[0]).toMatchObject({ title: 'Research the workflow', metadata: { owner: 'Host application' } });
    expect(grid.source[0]).not.toHaveProperty('__kanbanCommunityIndex');
  });
  it('keeps translations and session data independent', () => {
    const pt = createCommunitySession(undefined, communityLanguage('?lang=pt'));
    const en = createCommunitySession();
    expect(pt.labels.save).toBe('Guardar cópia');
    expect(pt.toolbar.labels?.filters).toBe('Filtros');
    pt.source[0].title = 'Local';
    expect(en.source[0].title).toBe('Research the workflow');
    expect(pt.config).not.toHaveProperty('history');
  });
});
