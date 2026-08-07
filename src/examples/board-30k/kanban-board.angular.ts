import { Component, Input, NO_ERRORS_SCHEMA, ViewEncapsulation } from '@angular/core';
import type { OnDestroy } from '@angular/core';
import { RevoGrid } from '@revolist/angular-datagrid';
import { KanbanCardEditorDialogPlugin, KanbanPlugin } from '@revolist/revogrid-enterprise';
import { currentTheme, observeCurrentTheme } from '../../theme';
import { createKanbanBoardConfig, createKanbanBoardEditor, KANBAN_BOARD_COLUMNS, resolveKanbanBoardRows, type KanbanBoardCard } from './kanban-board-data';

@Component({
  selector: 'kanban-board-grid',
  standalone: true,
  imports: [RevoGrid],
  schemas: [NO_ERRORS_SCHEMA],
  styleUrls: ['./kanban-board.scss'],
  encapsulation: ViewEncapsulation.None,
  template: `<div class="kanban-board"><revo-grid class="kanban-board__grid" [hideAttribution]="true" [resize]="true" [source]="gridRows" [columns]="columns" [plugins]="plugins" [columnTypes]="columnTypes" [additionalData]="additionalData" [kanban]="kanban" [kanbanCardEditorDialog]="editor" [theme]="theme"></revo-grid></div>`,
})
export class KanbanBoardGridComponent implements OnDestroy {
  @Input() rows?: KanbanBoardCard[];
  readonly columns = KANBAN_BOARD_COLUMNS;
  readonly plugins = [KanbanPlugin, KanbanCardEditorDialogPlugin];
  readonly columnTypes = {};
  readonly additionalData = {};
  theme = currentTheme().isDark() ? 'darkCompact' : 'compact';
  readonly kanban = createKanbanBoardConfig();
  readonly editor = createKanbanBoardEditor();
  private readonly disconnectTheme = observeCurrentTheme((isDark) => {
    this.theme = isDark ? 'darkCompact' : 'compact';
  });
  get gridRows() { return resolveKanbanBoardRows(this.rows); }
  ngOnDestroy() { this.disconnectTheme(); }
}
