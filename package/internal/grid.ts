import {
  getColumns,
  type AdditionalData,
  type ColumnGrouping,
  type ColumnRegular,
  type ColumnType,
  type DataType,
  type PluginProviders,
  type RowDefinition,
} from '@revolist/revogrid';
export interface GridPresentation<Projection> {
  readonly className: string;
  readonly initialize?: () => void;
  readonly project: (projection: Projection) => {
    readonly rows: readonly DataType[];
    readonly columns: readonly (ColumnGrouping | ColumnRegular)[];
    readonly rowHeaders: HTMLRevoGridElement['rowHeaders'];
    readonly rowSize: number;
    readonly rowDefinitions: RowDefinition[];
  };
}

interface KanbanGridSnapshot<T extends DataType> {
  source: readonly T[];
  columns: (ColumnGrouping | ColumnRegular)[];
  readonly columnTypes: Record<string, ColumnType>;
  readonly additionalData: AdditionalData;
  readonly rowDefinitions: RowDefinition[];
  readonly rowSize: number;
  readonly rowHeaders: HTMLRevoGridElement['rowHeaders'];
  readonly range: HTMLRevoGridElement['range'];
  readonly canFocus: HTMLRevoGridElement['canFocus'];
  readonly resize: HTMLRevoGridElement['resize'];
  readonly disableVirtualY: boolean;
}

export class KanbanGridProjection<T extends DataType = DataType, Projection = unknown> {
  protected get gridElement(): HTMLRevoGridElement {
    return this.grid;
  }
  private snapshot: KanbanGridSnapshot<T> | null = null;
  private applyingSource = false;
  private applyingColumns = false;

  constructor(
    private readonly grid: HTMLRevoGridElement,
    private readonly providers: Pick<PluginProviders, 'column' | 'data' | 'dimension'>,
    private readonly presentation: GridPresentation<Projection>,
  ) {}

  initialize(): void {
    if (this.snapshot) {
      return;
    }
    this.snapshot = {
      source: [...((this.grid.source as T[]) ?? [])],
      columns: [...(this.grid.columns ?? [])],
      columnTypes: { ...(this.grid.columnTypes ?? {}) },
      additionalData: { ...(this.grid.additionalData ?? {}) },
      rowDefinitions: [...(this.grid.rowDefinitions ?? [])],
      rowSize: this.grid.rowSize ?? 0,
      rowHeaders: this.grid.rowHeaders,
      range: this.grid.range,
      canFocus: this.grid.canFocus,
      resize: this.grid.resize,
      disableVirtualY: this.grid.disableVirtualY,
    };
    this.grid.classList.add(this.presentation.className);
    this.grid.range = false;
    this.grid.canFocus = false;
    this.grid.resize = true;
    this.grid.disableVirtualY = false;
    this.presentation.initialize?.();
  }

  applyProjection(
    projection: Projection,
    options: {
      readonly applyColumns?: boolean;
      readonly applyRows?: boolean;
    } = {},
  ): void {
    this.initialize();
    const plan = this.presentation.project(projection);
    this.grid.rowHeaders = plan.rowHeaders;
    this.grid.rowSize = plan.rowSize;
    this.grid.rowDefinitions = plan.rowDefinitions;
    if (options.applyRows !== false) {
      this.applyRows(plan.rows);
    }
    if (options.applyColumns !== false) {
      this.applyColumns(plan.columns);
    } else {
      this.providers.column.refreshByType('rgCol');
    }
  }

  captureSource(source: readonly T[]): void {
    if (!this.snapshot || this.applyingSource) {
      return;
    }
    this.snapshot.source = source;
  }

  captureColumns(columns: readonly (ColumnGrouping | ColumnRegular)[]): void {
    if (!this.snapshot || this.applyingColumns) {
      return;
    }
    this.snapshot.columns = [...columns];
  }

  restore(source?: readonly T[]): void {
    if (!this.snapshot) {
      return;
    }
    const snapshot = this.snapshot;
    const canonical = [...(source ?? snapshot.source)];
    this.grid.classList.remove(this.presentation.className);
    this.applyingSource = true;
    try {
      this.grid.rowDefinitions = [...snapshot.rowDefinitions];
      this.grid.source = canonical;
      this.providers.data.setData(canonical, 'rgRow', snapshot.disableVirtualY);
    } finally {
      this.applyingSource = false;
    }
    this.applyingColumns = true;
    try {
      this.grid.columns = [...snapshot.columns];
      this.applyColumns(snapshot.columns);
    } finally {
      this.applyingColumns = false;
    }
    this.grid.columnTypes = { ...snapshot.columnTypes };
    this.grid.additionalData = { ...snapshot.additionalData };
    this.grid.rowSize = snapshot.rowSize;
    this.grid.rowHeaders = snapshot.rowHeaders;
    this.grid.range = snapshot.range;
    this.grid.canFocus = snapshot.canFocus;
    this.grid.resize = snapshot.resize;
    this.grid.disableVirtualY = snapshot.disableVirtualY;
    this.snapshot = null;
  }

  isApplyingSource(): boolean {
    return this.applyingSource;
  }

  isApplyingColumns(): boolean {
    return this.applyingColumns;
  }

  refresh(): void {
    this.providers.column.refreshByType('rgCol');
  }

  refreshRows(): void {
    this.providers.data.refreshItems('rgRow');
  }

  private applyRows(rows: readonly DataType[]): void {
    this.applyingSource = true;
    try {
      this.providers.data.setData([...rows], 'rgRow', this.grid.disableVirtualY, undefined, true, true);
    } finally {
      this.applyingSource = false;
    }
  }

  private applyColumns(columns: readonly (ColumnGrouping | ColumnRegular)[]): void {
    const wasApplying = this.applyingColumns;
    this.applyingColumns = true;
    try {
      const gathered = getColumns([...columns], 0, this.grid.columnTypes);
      const beforeSet = this.emitGridEvent('beforecolumnsset', gathered);
      if (beforeSet.defaultPrevented) {
        return;
      }
      this.providers.dimension.applyNewColumns(
        beforeSet.detail.columns,
        this.grid.disableVirtualX,
        false,
        this.grid.virtualX,
      );
      const beforeApplied = this.emitGridEvent('beforecolumnapplied', beforeSet.detail);
      if (beforeApplied.defaultPrevented) {
        return;
      }
      const appliedColumns = this.providers.column.setColumns(beforeApplied.detail);
      const order = Object.fromEntries(
        Object.entries(beforeApplied.detail.sort).map(([prop, item]) => [prop, item.order]),
      );
      this.emitGridEvent('aftercolumnsset', { columns: appliedColumns, order });
    } finally {
      this.applyingColumns = wasApplying;
    }
  }

  private emitGridEvent<T>(eventName: string, detail: T): CustomEvent<T> {
    const event = new CustomEvent<T>(eventName, { detail, cancelable: true });
    this.grid.dispatchEvent(event);
    return event;
  }
}
