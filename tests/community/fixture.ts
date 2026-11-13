import { defineCustomElements } from '@revolist/revogrid/loader';
import { KanbanPlugin, KanbanToolbarPlugin, KanbanCardEditorDialogPlugin } from '@revolist/kanban-community';
import '@revolist/kanban-community/styles.css';
await defineCustomElements();
const grid = document.createElement('revo-grid');
grid.style.cssText = 'width:100%;height:600px;display:block;';
grid.columns = [{ prop: 'title', name: 'Title' }];
grid.source = [
  {
    id: 'a',
    title: 'First task',
    description: 'Keep the metadata',
    status: 'todo',
    order: 1024,
    metadata: { owner: 'host' },
  },
  { id: 'b', title: 'Second task', description: '', status: 'todo', order: 2048 },
  { id: 'c', title: 'Completed task', description: '', status: 'done', order: 1024 },
];
grid.kanban = {
  columns: [
    { prop: 'todo', name: 'Todo' },
    { prop: 'done', name: 'Done', wipLimit: 2 },
  ],
  wipBehavior: 'block',
};
grid.plugins = [KanbanPlugin, KanbanToolbarPlugin, KanbanCardEditorDialogPlugin];
document.querySelector('#app')!.append(grid);
await grid.componentOnReady();
const plugins = await grid.getPlugins();
const board = plugins.find((plugin) => plugin instanceof KanbanPlugin) as KanbanPlugin;
Object.assign(window, { grid, board, Editor: KanbanCardEditorDialogPlugin, ready: true });
