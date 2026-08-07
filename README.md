<div align="center">

# RevoGrid Kanban

**Grid-backed workflow boards with one canonical, application-owned data source.**

[![Frameworks](https://img.shields.io/badge/TypeScript%20%7C%20React%20%7C%20Vue%20%7C%20Angular-4f46e5)](#framework-examples)
[![License: MIT](https://img.shields.io/badge/Example%20license-MIT-16a34a.svg)](./LICENSE)

[View live demo](https://kanban.rv-grid.com/demo/) · [Request trial](https://pro.rv-grid.com/guides/installation-npm-trial/) · [Get Pro Advanced](https://rv-grid.com/pricing/)

[![RevoGrid Kanban walkthrough](./assets/kanban-walkthrough.gif)](./assets/kanban-walkthrough.mp4)

</div>

This repository hosts multiple Kanban examples implemented in Vanilla TypeScript,
React, Vue, and Angular. The example is selected with the `example` URL query;
the framework is selected by the existing Vite mode.

## Examples

| Example | URL | Purpose |
| --- | --- | --- |
| Classic Kanban Showcase | `/?example=showcase` | Rich cards, workflow rules, team swimlanes, activity, progress, and drag-and-drop. |
| 30K Cards Board | `/?example=board-30k` | Virtualize 30,000 cards across 10 workflow columns and two team swimlanes. |

Missing or unknown example ids fall back to the Classic Kanban Showcase.

## What it features

- Ordered workflow columns with per-column WIP limits
- Team swimlanes with lane-specific limits and collapse controls
- Source-backed drag-and-drop across columns and teams
- Card rules, priority cues, progress, assignees, due dates, and activity
- Custom card, column-header, and swimlane-header presentation
- Column and swimlane collapse for dense operational boards
- Context-menu and card-editor integration points

## Pro features

| API | How the showcase uses it |
| --- | --- |
| `KanbanPlugin` | Projects source rows into virtualized workflow columns while keeping identity, status, and ordering in application data. |
| `KanbanConfig` | Defines columns, WIP limits, swimlanes, card fields, rules, collapse behavior, and customization hooks. |
| `KanbanCardEditorDialogPlugin` | Supplies the production card-editing surface used by the Kanban dependency stack. |

The board maps `id`, `status`, and `order` explicitly. Applications can persist
plugin events back to the same row model without maintaining a second board-only
state tree.

## Recipes

| Recipe | What it demonstrates |
| --- | --- |
| [`workflow-wip.ts`](./recipes/workflow-wip.ts) | Ordered workflow columns and focused WIP limits. |
| [`swimlanes-collapse.ts`](./recipes/swimlanes-collapse.ts) | Team swimlanes and compact collapse behavior. |
| [`card-movement.ts`](./recipes/card-movement.ts) | Source-backed status and order updates after a card move. |

## Framework examples

| Framework | Entry point | Command |
| --- | --- | --- |
| Vanilla TypeScript | [`src/examples/showcase/kanban.ts`](./src/examples/showcase/kanban.ts) | `pnpm dev` |
| React | [`src/examples/showcase/kanban.react.tsx`](./src/examples/showcase/kanban.react.tsx) | `pnpm dev:react` |
| Vue 3 | [`src/examples/showcase/kanban.vue`](./src/examples/showcase/kanban.vue) | `pnpm dev:vue` |
| Angular | [`src/examples/showcase/kanban.angular.ts`](./src/examples/showcase/kanban.angular.ts) | `pnpm dev:angular` |

Each command can open any registered example. New examples live in an isolated
`src/examples/<example-id>/` directory and are registered in
[`src/examples.ts`](./src/examples.ts). Shared theme observation lives in
[`src/theme.ts`](./src/theme.ts).

## Run it

```bash
pnpm install
pnpm dev
pnpm dev:react
pnpm dev:vue
pnpm dev:angular
```

Run `pnpm test`, `pnpm build:frameworks`, and `pnpm test:e2e` before submitting
changes.

Trial users must authenticate with the registry described in the [official
trial installation guide](https://pro.rv-grid.com/guides/installation-npm-trial/).
No registry token belongs in this repository. Licensed users can replace the two
trial aliases in `package.json` with the matching licensed RevoGrid packages;
source imports remain unchanged.

## Media

The deterministic recorder in [`scripts/record-media.mjs`](./scripts/record-media.mjs)
captures the captioned walkthrough, poster, and four workflow screenshots from
the canonical TypeScript build. `pnpm media:inspect` produces a temporary review
contact sheet; `pnpm media:record` updates committed assets intentionally.

## License

The examples, recipes, tests, documentation, and media tooling are MIT licensed.
Commercial RevoGrid packages are not covered by this repository's MIT license.
