import { Component, Input, NO_ERRORS_SCHEMA, ViewEncapsulation } from '@angular/core';
import type { OnDestroy } from '@angular/core';
import { RevoGrid } from '@revolist/angular-datagrid';
import { KanbanPlugin } from '@revolist/kanban';
import { currentTheme, observeCurrentTheme } from '../../theme';
import {
  createKanbanServerConfig,
  KANBAN_SERVER_COLUMNS,
  type ServerCard,
} from './kanban-server-loading.shared';

@Component({
  selector: 'kanban-server-loading-grid',
  standalone: true,
  imports: [RevoGrid],
  schemas: [NO_ERRORS_SCHEMA],
  styleUrls: ['./kanban-server-loading.scss'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="kanban-server-loading" [class.kanban-server-loading--dark]="isDark">
      <p class="kanban-server-loading__notice" role="status" aria-live="polite">{{ notification }}</p>
      <revo-grid
        class="kanban-server-loading__grid"
        [hideAttribution]="true"
        [resize]="true"
        [source]="rows"
        [columns]="columns"
        [plugins]="plugins"
        [columnTypes]="columnTypes"
        [additionalData]="additionalData"
        [kanban]="kanban"
        [theme]="theme"
      ></revo-grid>
    </section>
  `,
})
export class KanbanServerLoadingGridComponent implements OnDestroy {
  @Input() rows: ServerCard[] = [];
  notification = 'Waiting for server…';
  readonly columns = KANBAN_SERVER_COLUMNS;
  readonly plugins = [KanbanPlugin];
  readonly columnTypes = {};
  readonly additionalData = {};
  readonly kanban = createKanbanServerConfig((message) => {
    this.notification = message;
  });
  isDark = currentTheme().isDark();
  theme = this.isDark ? 'darkCompact' : 'compact';
  private readonly disconnectTheme = observeCurrentTheme((isDark) => {
    this.isDark = isDark;
    this.theme = isDark ? 'darkCompact' : 'compact';
  });

  ngOnDestroy() {
    this.disconnectTheme();
  }
}
