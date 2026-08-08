import { Component, Input, NO_ERRORS_SCHEMA, ViewEncapsulation } from '@angular/core';
import type { OnDestroy } from '@angular/core';
import { RevoGrid } from '@revolist/angular-datagrid';
import { KanbanPlugin } from '@revolist/revogrid-enterprise';
import type { KanbanUseCaseScenario } from './kanban-use-case-model';
import { createKanbanUseCaseConfig, kanbanUseCaseShellClass, resolveKanbanUseCaseDark } from './kanban-use-case-model';
import { currentTheme, observeCurrentTheme } from '../theme';

@Component({
  selector: 'kanban-use-case-demo',
  standalone: true,
  imports: [RevoGrid],
  schemas: [NO_ERRORS_SCHEMA],
  styleUrls: ['./kanban-use-case-demo.scss'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <section [class]="shellClass" [attr.aria-label]="scenario.title">
      <header class="kanban-use-case-header">
        <div class="kanban-use-case-header__main">
          <div class="kanban-use-case-identity">
            <span class="kanban-use-case-eyebrow">{{ scenario.eyebrow }}</span>
            <strong class="kanban-use-case-title">{{ scenario.title }}</strong>
          </div>
          <div class="kanban-use-case-metrics">
            @for (metric of scenario.metrics; track metric.label) {
              <div [class]="'kanban-use-case-metric kanban-use-case-metric--' + (metric.tone ?? 'neutral')">
                <strong class="kanban-use-case-metric__value">{{ metric.value }}</strong>
                <span class="kanban-use-case-metric__label">{{ metric.label }}</span>
              </div>
            }
          </div>
        </div>
        <div [class]="'kanban-use-case-status kanban-use-case-status--' + scenario.attention.tone">
          <span class="kanban-use-case-status__dot" aria-hidden="true"></span>
          <span><strong>{{ scenario.attention.label }}:</strong> {{ scenario.attention.detail }}</span>
        </div>
      </header>
      <revo-grid
        class="kanban-use-case-grid"
        [hideAttribution]="true"
        [resize]="true"
        [source]="source"
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
export class KanbanUseCaseDemoComponent implements OnDestroy {
  @Input({ required: true }) scenario!: KanbanUseCaseScenario;
  readonly plugins = [KanbanPlugin];
  readonly columnTypes = {};
  readonly additionalData = {};
  hostIsDark = currentTheme().isDark();
  private readonly disconnectTheme = observeCurrentTheme((dark) => {
    this.hostIsDark = dark;
  });

  get source() { return [...this.scenario.cards]; }
  get columns() { return [...this.scenario.columns]; }
  get kanban() { return createKanbanUseCaseConfig(this.scenario); }
  get theme() { return resolveKanbanUseCaseDark(this.scenario, this.hostIsDark) ? 'darkCompact' : 'compact'; }
  get shellClass() { return kanbanUseCaseShellClass(this.scenario, this.hostIsDark); }

  ngOnDestroy(): void {
    this.disconnectTheme();
  }
}
