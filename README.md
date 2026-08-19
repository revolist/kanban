<div align="center">

# RevoGrid Kanban

[View live demo](https://kanban.rv-grid.com/) · [Get Pro Advanced](https://rv-grid.com/pricing/)

[![RevoGrid Kanban walkthrough](./assets/kanban-walkthrough.gif)](./assets/kanban-walkthrough.mp4)

</div>

RevoGrid Kanban is a JavaScript workflow-board component built on RevoGrid. It
projects application-owned rows into fast, interactive cards and swimlanes
without introducing a separate board data model.

## Key capabilities

- Define ordered workflow columns with configurable WIP limits
- Organize work into collapsible swimlanes with lane-specific policies
- Move cards across columns and lanes with source-backed drag and drop
- Edit cards through built-in dialogs, context menus, and application events
- Add priority, progress, assignee, activity, status, and due-date presentation
- Customize cards, column headers, swimlane headers, rules, labels, and selection
- Support keyboard interaction, history, filtering, and read-only workflows
- Virtualize 50,000 local cards or page through 100,000 remotely loaded cards
- Persist status and order changes directly to the application's canonical rows

## Installation

### Free trial

The public trial registry requires no token or login. Configure it for this
project and install the trial packages under the production import names:

```bash
pnpm config set @revolist:registry https://trial.rv-grid.com --location=project
pnpm i @revolist/revogrid-pro@npm:@revolist/rv-pro-trial@2.7.13 @revolist/kanban@npm:@revolist/kanban-trial@2.7.13
```

### Pro

Paid users can remove the trial registry override and install the licensed
packages. Source imports stay unchanged.

```bash
pnpm config delete @revolist:registry --location=project
pnpm i @revolist/revogrid-pro@2.7.13 @revolist/kanban@2.7.13
```

## Quick start

```ts
import { defineCustomElements } from '@revolist/revogrid/loader';
import { KanbanPlugin } from '@revolist/kanban';
import '@revolist/kanban/styles.css';

defineCustomElements();

const grid = document.createElement('revo-grid');
grid.plugins = [KanbanPlugin];
grid.kanban = {
  columns: [
    { prop: 'todo', name: 'To do', wipLimit: 5 },
    { prop: 'doing', name: 'In progress', wipLimit: 3 },
    { prop: 'done', name: 'Done' },
  ],
  idField: 'id',
  columnField: 'status',
  orderField: 'order',
  card: { titleField: 'title' },
};
document.querySelector('#app')?.appendChild(grid);
grid.source = [
  { id: 'task-1', title: 'Plan release', status: 'todo', order: 1000 },
  { id: 'task-2', title: 'Build feature', status: 'doing', order: 1000 },
];
```

## Framework integrations

The component uses the same board configuration across supported frameworks.

| Framework | Integration source | Start command |
| --- | --- | --- |
| Vanilla TypeScript | [`src/examples/showcase/kanban.ts`](./src/examples/showcase/kanban.ts) | `pnpm dev` |
| React | [`src/examples/showcase/kanban.react.tsx`](./src/examples/showcase/kanban.react.tsx) | `pnpm dev:react` |
| Vue 3 | [`src/examples/showcase/kanban.vue`](./src/examples/showcase/kanban.vue) | `pnpm dev:vue` |
| Angular | [`src/examples/showcase/kanban.angular.ts`](./src/examples/showcase/kanban.angular.ts) | `pnpm dev:angular` |

Build all integrations with `pnpm build:frameworks`.

## Run the examples

Clone the component repository, follow either the **Free trial** or **Pro**
installation above, and start the default workflow board:

```bash
git clone https://github.com/revolist/kanban.git
cd kanban
pnpm dev
```

Open [http://localhost:5173/](http://localhost:5173/). Add an `example` query
parameter to run another Kanban workflow:

| Example | Live | Local URL | Source |
| --- | --- | --- | --- |
| Workflow board | [Open](https://kanban.rv-grid.com/) | [Default view](http://localhost:5173/) | [`src/examples/showcase/kanban.ts`](./src/examples/showcase/kanban.ts) |
| 50,000 local cards | [Open](https://kanban.rv-grid.com/?example=performance) | [`?example=performance`](http://localhost:5173/?example=performance) | [`src/examples/performance/kanban-board.ts`](./src/examples/performance/kanban-board.ts) |
| 100,000 remote cards | [Open](https://kanban.rv-grid.com/?example=server-loading) | [`?example=server-loading`](http://localhost:5173/?example=server-loading) | [`src/examples/server-loading/kanban-server-loading.ts`](./src/examples/server-loading/kanban-server-loading.ts) |
| Product delivery | [Open](https://kanban.rv-grid.com/?example=product-delivery) | [`?example=product-delivery`](http://localhost:5173/?example=product-delivery) | [`src/use-cases/product-delivery/product-delivery.ts`](./src/use-cases/product-delivery/product-delivery.ts) |
| Support operations | [Open](https://kanban.rv-grid.com/?example=support-operations) | [`?example=support-operations`](http://localhost:5173/?example=support-operations) | [`src/use-cases/support-operations/support-operations.ts`](./src/use-cases/support-operations/support-operations.ts) |
| Sales onboarding | [Open](https://kanban.rv-grid.com/?example=sales-onboarding) | [`?example=sales-onboarding`](http://localhost:5173/?example=sales-onboarding) | [`src/use-cases/sales-onboarding/sales-onboarding.ts`](./src/use-cases/sales-onboarding/sales-onboarding.ts) |
| Content approvals | [Open](https://kanban.rv-grid.com/?example=content-approvals) | [`?example=content-approvals`](http://localhost:5173/?example=content-approvals) | [`src/use-cases/content-approvals/content-approvals.ts`](./src/use-cases/content-approvals/content-approvals.ts) |
| Quality manufacturing | [Open](https://kanban.rv-grid.com/?example=quality-manufacturing) | [`?example=quality-manufacturing`](http://localhost:5173/?example=quality-manufacturing) | [`src/use-cases/quality-manufacturing/quality-manufacturing.ts`](./src/use-cases/quality-manufacturing/quality-manufacturing.ts) |
| Internal workflows | [Open](https://kanban.rv-grid.com/?example=internal-workflows) | [`?example=internal-workflows`](http://localhost:5173/?example=internal-workflows) | [`src/use-cases/internal-workflows/internal-workflows.ts`](./src/use-cases/internal-workflows/internal-workflows.ts) |

The same query parameter works with `pnpm dev:react`, `pnpm dev:vue`, and
`pnpm dev:angular`.

## Resources

- [Kanban documentation](https://pro.rv-grid.com/guides/kanban/)
- [Kanban API](https://pro.rv-grid.com/api/kanban/)
- [Trial installation guide](https://pro.rv-grid.com/guides/installation-npm-trial/)

## License

The integration source and supporting assets in this repository are MIT
licensed. RevoGrid Pro and RevoGrid Kanban are commercial packages distributed
under the license supplied with your subscription.
