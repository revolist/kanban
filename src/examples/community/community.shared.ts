import {
  KanbanPlugin,
  KanbanToolbarPlugin,
  type KanbanConfig,
  type KanbanToolbarOptions,
} from '@revolist/kanban-community';
import '@revolist/kanban-community/styles.css';
import './community.scss';
export interface CommunityCard {
  id: string;
  title: string;
  description: string;
  status: string;
  order: number;
  metadata: { owner: string };
}
const captions = {
  en: {
    title: 'Kanban Community',
    intro: 'A local board with editing, filtering and column limits.',
    save: 'Save snapshot',
    load: 'Reload snapshot',
    saved: 'Snapshot saved.',
    loaded: 'Snapshot reloaded.',
    initial: 'Edit a card, save a snapshot, then reload it.',
    todo: 'To do',
    doing: 'In progress',
    done: 'Done',
  },
  pt: {
    title: 'Kanban Community',
    intro: 'Quadro local com edição, filtros e limites por coluna.',
    save: 'Guardar cópia',
    load: 'Recarregar cópia',
    saved: 'Cópia guardada.',
    loaded: 'Cópia recarregada.',
    initial: 'Edite um cartão, guarde uma cópia e recarregue-a.',
    todo: 'Por fazer',
    doing: 'Em curso',
    done: 'Concluído',
  },
};
export function communityLanguage(search = window.location.search): 'pt' | 'en' {
  return new URLSearchParams(search).get('lang') === 'pt' ? 'pt' : 'en';
}
/** Host-owned snapshots deliberately use canonical records, never the grid's presentation rows. */
export function createCommunitySession(rows?: readonly CommunityCard[], language: 'pt' | 'en' = 'en') {
  const labels = captions[language];
  const source: CommunityCard[] = rows
    ? structuredClone([...rows])
    : [
        {
          id: 'research',
          title: 'Research the workflow',
          description: 'Keep application-owned metadata while editing.',
          status: 'todo',
          order: 1024,
          metadata: { owner: 'application' },
        },
        {
          id: 'prototype',
          title: 'Build the prototype',
          description: 'Move cards using a pointer, touch or arrow keys.',
          status: 'doing',
          order: 1024,
          metadata: { owner: 'application' },
        },
        {
          id: 'review',
          title: 'Review the results',
          description: 'Save and reload a complete application snapshot.',
          status: 'done',
          order: 1024,
          metadata: { owner: 'application' },
        },
      ];
  const config: KanbanConfig<CommunityCard> = {
    columns: [
      { prop: 'todo', name: labels.todo },
      { prop: 'doing', name: labels.doing, wipLimit: 2 },
      { prop: 'done', name: labels.done },
    ],
    wipBehavior: 'block',
    cardRowHeight: 156,
    locale: language,
    labels:
      language === 'pt'
        ? {
            title: 'Título',
            description: 'Descrição',
            column: 'Coluna',
            newCard: 'Novo cartão',
            add: 'Adicionar cartão',
            edit: 'Editar cartão',
            delete: 'Eliminar',
            save: 'Guardar',
            cancel: 'Cancelar',
            search: 'Pesquisar cartões',
            board: 'Quadro Kanban',
            required: 'Este campo é obrigatório.',
            expandColumn: 'Expandir coluna',
            collapseColumn: 'Recolher coluna',
            selected: (count) => `${count} selecionados`,
            changed: (count) => `${count} cartões alterados`,
            moved: (count) => `${count} cartões movidos`,
            wip: (limit) => `Limite de ${limit} cartões excedido.`,
          }
        : undefined,
  };
  const toolbar: KanbanToolbarOptions =
    language === 'pt'
      ? {
          labels: {
            toolbar: 'Quadro Kanban',
            actions: 'Ações',
            add: 'Adicionar cartão',
            edit: 'Editar cartão',
            delete: 'Eliminar',
            deleteMany: (count) => `Eliminar ${count} cartões`,
            search: 'Pesquisar cartões',
            workflow: 'Coluna',
            filters: 'Filtros',
            closeFilters: 'Fechar filtros',
            done: 'Concluir',
            all: 'Todos',
            clear: 'Limpar',
            views: 'Vistas',
            board: 'Quadro',
            table: 'Tabela',
            selection: (count) => `${count} selecionados`,
            count: (visible, total) => `${visible} de ${total} cartões`,
            empty: 'Sem cartões',
            createFirst: 'Criar cartão',
            pending: 'A aguardar alterações',
          },
        }
      : {};
  let snapshot = JSON.stringify(source);
  async function save(grid?: HTMLRevoGridElement | null): Promise<string | undefined> {
    if (!grid?.isConnected) {
      return;
    }
    await grid.componentOnReady();
    const board = (await grid.getPlugins()).find((plugin) => plugin instanceof KanbanPlugin) as
      | KanbanPlugin<CommunityCard>
      | undefined;
    if (!grid.isConnected || !board) {
      return;
    }
    snapshot = JSON.stringify(board.getCards());
    return labels.saved;
  }
  function load(grid?: HTMLRevoGridElement | null): string | undefined {
    if (!grid?.isConnected) {
      return;
    }
    grid.source = JSON.parse(snapshot) as CommunityCard[];
    return labels.loaded;
  }
  return { source, config, toolbar, labels, plugins: [KanbanPlugin, KanbanToolbarPlugin], save, load };
}
