# RevoGrid Kanban Community

`@revolist/kanban-community` provides an MIT-licensed local column board on RevoGrid. It includes card CRUD, the
packaged editor, an optional toolbar, selection, atomic batch movement, column WIP limits, local filtering, custom
content/fields and grid virtualization. Applications own fetching, saving and reloading canonical card records.

```ts
import { defineCustomElements } from '@revolist/revogrid/loader';
import { KanbanPlugin, KanbanToolbarPlugin } from '@revolist/kanban-community';
import '@revolist/kanban-community/styles.css';

await defineCustomElements();
const grid = document.createElement('revo-grid');
grid.style.height = '600px';
grid.source = [{ id: 'task-1', title: 'First task', status: 'todo', order: 1024 }];
grid.kanban = {
  columns: [
    { prop: 'todo', name: 'To do' },
    { prop: 'done', name: 'Done', wipLimit: 5 },
  ],
  wipBehavior: 'block',
};
grid.plugins = [KanbanPlugin, KanbanToolbarPlugin];
document.body.append(grid);
await grid.componentOnReady();
const board = (await grid.getPlugins()).find((plugin) => plugin instanceof KanbanPlugin)!;

// Fetch and reload are application actions; preserve the full records.
const saved = JSON.stringify(board.getCards());
grid.source = JSON.parse(saved);
```

The board installs one editor. Set `grid.kanbanCardEditorDialog = false` to handle editor requests yourself. Configure
`fields` and asynchronous `validate` through `grid.kanbanCardEditorDialog`. Set `grid.kanbanToolbar = false` to hide the
toolbar, or omit its plugin. Host translations are supplied through `grid.kanban.labels`; field labels and validation
messages are host-owned. Unknown record metadata is retained by edits and movement.

`beforekanbancardcreate`, `beforekanbancardupdate`, `beforekanbancarddelete` and `beforekanbancardmove` are cancellable.
The matching `kanbancard*` events and `kanban-card-change` announce committed changes. Cancel `kanbancardcreaterequest`,
`kanbancardeditrequest` or `kanbancarddeleterequest` to own those interactions. Use `board.getCards()` for persistence;
`grid.source` can contain presentation rows while the board is active. Setting `grid.kanban = false` restores the host
columns and the current canonical records.

For DOM-free model operations, import `KanbanBoardController` and helpers from `@revolist/kanban-community/core`. Both
ESM and CommonJS core entries avoid browser/UI imports. The browser entry also supplies a UMD build; its globals are
`Revogrid`, `RevoGridRuntime`, `RevoUI`, `preact` and `preactJsxRuntime`.

History, swimlanes, context menus, managed remote loading, persistence/recovery, approvals, AI and Pro view integration
are commercial features supplied by `@revolist/kanban`. Community does not install those implementations. Existing
commercial consumers can retain their imports and CSS aliases. The commercial board inherits Community CRUD/move, editor
and toolbar controllers and supplies paid placement, mediation and UI contributions. The shared controller, card frame,
filtering and grid lifecycle have one implementation. `internal/*` entries are the versioned composition contract for
the commercial facade; applications should use the browser or core entries.

## Development and verification

The private root showcase and its framework starters remain separate. Community source, manifest and tests live here.
Use Node 24.15+ and pnpm 11.25. The public CI workflow creates a workspace containing only this package,
`revolist/grid-runtime` and `revolist/revo-ui`, and uses the public npm registry without private credentials. Before
initial publication, build those public source candidates together as the workflow demonstrates.

```sh
pnpm format
pnpm format:check
pnpm lint
pnpm test
pnpm build
pnpm test:core
```

Prettier uses a 120-character print width. ESLint requires control-flow braces and enforces a 120-character line limit.
The browser fixture doubles as a small host-owned save/load integration example.

For archive verification, pack this package, runtime and the **prepared UI distribution** into one directory:
`revolist-kanban-community-4.0.9.tgz`, `revolist-grid-runtime-4.0.9.tgz`, `revolist-ui-4.0.9.tgz`.

```sh
KANBAN_ARTIFACTS_DIR=/absolute/path/to/artifacts pnpm prepare:consumer
pnpm test:browser
```

This installs the archives in a temporary consumer outside the repository. The consumer has no Pro aliases or trial
injection. Public artifact tests are separate from the existing paid starter checks. Build and pack are release
preparation; publishing, merging and deploying the showcase are separate actions.
