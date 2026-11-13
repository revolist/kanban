/** @jsxImportSource preact */
import { h, type ComponentChildren } from 'preact';
import { renderPreactInto } from '@revolist/ui/preact-mount';
const render = (view: ComponentChildren, host: Element): void => renderPreactInto(host, view);
import { CorePlugin, bindObservableProp } from '@revolist/grid-runtime';
import type { PluginProviders } from '@revolist/revogrid';
import { ButtonControl, Input } from '@revolist/ui/native-control';
import { KanbanPlugin } from './plugin.js';
import { resolveKanbanLabels } from './labels.js';
export interface KanbanToolbarOptions {
  readonly search?: boolean;
}
export interface KanbanToolbarConfigRegistry {
  community: KanbanToolbarOptions;
}
export type KanbanToolbarHostConfig = KanbanToolbarConfigRegistry[keyof KanbanToolbarConfigRegistry];
declare global {
  interface HTMLRevoGridElement {
    kanbanToolbar?: KanbanToolbarHostConfig | false;
  }
}
declare module '@revolist/revogrid' {
  interface AdditionalData {
    kanbanToolbar?: KanbanToolbarHostConfig | false;
  }
}
export class KanbanToolbarPlugin extends CorePlugin {
  private communityToolbarHost!: HTMLDivElement;
  private communityOwnsToolbar = false;
  private communityToolbarOptions: KanbanToolbarOptions | false | undefined;
  constructor(
    grid: HTMLRevoGridElement,
    providers: PluginProviders,
    options: { readonly externalToolbar?: boolean } = {},
  ) {
    super(grid, providers);
    if (options.externalToolbar) {
      return;
    }
    this.communityOwnsToolbar = true;
    this.communityToolbarHost = grid.ownerDocument.createElement('div');
    this.communityToolbarHost.slot = 'header';
    grid.append(this.communityToolbarHost);
    this.communityToolbarOptions = bindObservableProp<KanbanToolbarOptions | false | undefined>(this, {
      prop: 'kanbanToolbar',
      apply: (options) => {
        this.communityToolbarOptions = options;
        this.refresh();
      },
    });
    for (const event of ['kanbanconfigchange', 'kanbanselectionchange', 'kanban-card-change']) {
      this.addEventListener(event, () => this.refresh());
    }
    this.refresh();
  }
  refresh(): void {
    const board = this.providers.plugins.getByClass(KanbanPlugin);
    const config = board?.getConfig();
    if (this.communityToolbarOptions === false || !config) {
      render(null, this.communityToolbarHost);
      return;
    }
    const labels = resolveKanbanLabels(config.labels);
    const ids = board!.getSelectedCardIds();
    render(
      <div class="kanban-community-toolbar" role="toolbar" aria-label={labels.board}>
        <ButtonControl type="button" disabled={!board!.canCreateCard()} onClick={() => board!.requestCreateCard()}>
          {labels.add}
        </ButtonControl>
        <ButtonControl
          type="button"
          disabled={ids.length !== 1 || !board!.canEditCard(ids[0])}
          onClick={() => board!.requestEditCard(ids[0])}
        >
          {labels.edit}
        </ButtonControl>
        <ButtonControl
          type="button"
          disabled={!board!.canDeleteCards(ids)}
          onClick={() => board!.requestDeleteCards(ids)}
        >
          {labels.delete}
        </ButtonControl>
        {this.communityToolbarOptions?.search !== false ? (
          <Input
            type="search"
            aria-label={labels.search}
            placeholder={labels.search}
            value={config.filter?.query ?? ''}
            onInput={(event) =>
              board!.setFilter({ ...config.filter, query: (event.currentTarget as HTMLInputElement).value })
            }
          />
        ) : null}
        <span aria-live="polite">{labels.selected(ids.length)}</span>
      </div>,
      this.communityToolbarHost,
    );
  }
  override destroy(): void {
    if (this.communityOwnsToolbar) {
      render(null, this.communityToolbarHost);
      this.communityToolbarHost.remove();
    }
    super.destroy();
  }
}
