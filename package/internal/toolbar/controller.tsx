/** @jsxImportSource preact */
import { h, type ComponentChildren } from 'preact';
import { renderPreactInto } from '@revolist/ui/preact-mount';
import { CorePlugin, bindObservableProp } from '@revolist/grid-runtime';
import type { PluginProviders } from '@revolist/revogrid';
import { KanbanToolbarFilters, filterValueKey, toolbarFilterOptions } from './filters.js';
import { DEFAULT_KANBAN_TOOLBAR_LABELS } from './labels.js';
import { toolbarFilters, toolbarModel, DEFAULT_TOOLBAR_ACTIONS } from './model.js';
import { KanbanToolbarView } from './view.js';
import { KanbanToolbarPopover } from './popover.js';
import type { KanbanToolbarOptions } from './types.js';
const render = (view: ComponentChildren, host: Element) => renderPreactInto(host, view);
export interface ToolbarContribution {
  readonly board: () => any;
  readonly role?: 'region' | 'toolbar';
  readonly visible?: (board: any) => boolean;
  readonly options?: (options: any) => KanbanToolbarOptions;
  readonly labels?: () => Partial<typeof DEFAULT_KANBAN_TOOLBAR_LABELS>;
  readonly capture?: (board: any) => any;
  readonly model?: (board: any) => ReturnType<typeof toolbarModel>;
  readonly action?: (action: string) => void;
  readonly extraActions?: (props: any) => ComponentChildren;
  readonly events?: readonly string[];
}
/** Optional controls; canonical cards and request behavior stay in Kanban. */
export class KanbanToolbarController extends CorePlugin {
  private readonly host: HTMLDivElement;
  private readonly filters = new KanbanToolbarFilters();
  private readonly popover: KanbanToolbarPopover;
  private options: KanbanToolbarOptions | false = {};
  private savedConfig?: any;
  private disposed = false;
  private queued = false;

  constructor(
    grid: HTMLRevoGridElement,
    providers: PluginProviders,
    private readonly contribution: ToolbarContribution,
  ) {
    super(grid, providers);
    this.popover = new KanbanToolbarPopover(grid, () => this.refresh());
    this.host = grid.ownerDocument.createElement('div');
    this.host.slot = 'header';
    this.host.className = 'kanban-toolbar-host rv-native-controls';
    grid.append(this.host);
    this.options = bindObservableProp<KanbanToolbarOptions | false | undefined, KanbanToolbarOptions | false>(this, {
      prop: 'kanbanToolbar',
      defaultValue: {},
      map: (value) => (value === false ? false : (this.contribution.options?.(value ?? {}) ?? value ?? {})),
      apply: (options) => {
        this.options = options;
        this.refresh();
      },
    });
    this.remember(this.kanban?.getConfig() ?? grid.kanban);
    this.addEventListener('kanbanconfigchange', (event) => {
      this.remember(event.detail.config);
      this.refresh();
    });
    for (const event of [
      'aftergridinit',
      'aftersourceset',
      'kanbanselectionchange',
      'kanban-card-change',
      'kanbandiagnostics',
      ...(this.contribution.events ?? []),
    ] as const) {
      this.addEventListener(event, () => this.refresh());
    }
    this.refresh();
  }

  refresh(): void {
    if (this.queued || this.disposed) {
      return;
    }
    this.queued = true;
    queueMicrotask(() => {
      this.queued = false;
      if (!this.disposed) {
        this.draw();
      }
    });
  }

  setView(board: boolean): boolean {
    const plugin = this.kanban;
    if (!plugin || this.options === false || this.model.pending) {
      return false;
    }
    if (!!plugin.getConfig() === board) {
      return true;
    }
    if (board) {
      if (!this.savedConfig) {
        return false;
      }
      this.revogrid.kanban = this.savedConfig;
    } else {
      this.savedConfig = this.contribution.capture?.(plugin) ?? plugin.getConfig();
      this.revogrid.kanban = false;
    }
    this.refresh();
    return true;
  }

  override destroy(): void {
    this.disposed = true;
    this.popover.destroy();
    render(null, this.host);
    this.host.remove();
    super.destroy();
  }

  private get kanban(): any {
    return this.contribution.board();
  }
  private get model() {
    return this.contribution.model?.(this.kanban) ?? toolbarModel(this.kanban);
  }
  private remember(config?: any): void {
    if (!config) {
      return;
    }
    this.savedConfig = config;
    this.filters.sync(config.filter);
  }
  private get definitions() {
    const options = this.options || {};
    return toolbarFilters(this.kanban?.getConfig() ?? this.savedConfig, options, this.labels.workflow);
  }
  private get labels() {
    return {
      ...DEFAULT_KANBAN_TOOLBAR_LABELS,
      ...this.contribution.labels?.(),
      ...(this.options ? this.options.labels : {}),
    };
  }

  private run(action: string): void {
    if (
      this.options === false ||
      !(this.options.actions ?? DEFAULT_TOOLBAR_ACTIONS).includes(action) ||
      !this.model.enabled[action]
    ) {
      return;
    }
    runBoardToolbarAction(action, this.kanban, this.contribution.action);
    this.refresh();
  }
  private applyFilter(): void {
    if (!this.kanban?.getConfig()) {
      return;
    }
    this.kanban.setFilter(this.filters.build(this.definitions));
    this.refresh();
  }
  private selectFilter(id: string, value: string): void {
    const definition = this.definitions.find((filter) => filter.id === id);
    if (!definition) {
      return;
    }
    const option = toolbarFilterOptions(definition, this.kanban?.getCards() ?? []).find(
      (option) => filterValueKey(option.value) === value,
    );
    if (option) {
      this.filters.selected.set(id, option.value);
    } else {
      this.filters.selected.delete(id);
    }
    this.applyFilter();
  }
  private draw(): void {
    const hidden = this.options === false || this.contribution.visible?.(this.kanban) === false;
    this.host.hidden = hidden;
    if (this.options === false || !this.kanban?.getConfig() || !this.definitions.length) {
      this.popover.close(false);
    }
    if (this.options === false || hidden) {
      render(null, this.host);
      return;
    }
    const plugin = this.kanban;
    render(
      <KanbanToolbarView
        popover={this.popover}
        role={this.contribution.role}
        model={this.model}
        extraActions={this.contribution.extraActions?.({
          model: this.model,
          options: this.options,
          labels: this.labels,
          onAction: (action: string) => this.run(action),
        })}
        options={this.options}
        labels={this.labels}
        cards={plugin?.getCards() ?? []}
        filters={this.definitions}
        filterState={this.filters}
        canSwitch={!!this.savedConfig}
        onAction={(action) => this.run(action)}
        onView={(board) => {
          this.setView(board);
        }}
        onSearch={(value) => {
          this.filters.query = value;
          this.applyFilter();
        }}
        onFilter={(id, value) => this.selectFilter(id, value)}
        onClear={() => {
          this.filters.clear();
          this.applyFilter();
        }}
      />,
      this.host,
    );
    this.popover.refresh();
  }
}

/** Dispatch ordinary requests through the board's canonical public event pipeline. */
export function runBoardToolbarAction(action: string, board: any, additional?: (action: string) => void): void {
  const selected = board?.getSelectedCardIds() ?? [];
  if (action === 'add') {
    board?.requestCreateCard();
  } else if (action === 'edit') {
    board?.requestEditCard(selected[0]);
  } else if (action === 'delete') {
    board?.requestDeleteCards(selected);
  } else {
    additional?.(action);
  }
}
