import { Component, Input, NO_ERRORS_SCHEMA, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { RevoGrid } from '@revolist/angular-datagrid';
import { currentTheme, observeCurrentTheme } from '../../theme';
import { createCommunitySession, communityLanguage, type CommunityCard } from './community.shared';
@Component({
  selector: 'kanban-community-grid',
  standalone: true,
  imports: [RevoGrid],
  schemas: [NO_ERRORS_SCHEMA],
  styleUrls: ['./community.scss'],
  encapsulation: ViewEncapsulation.None,
  template: `<section class="community-demo rv-native-controls" data-theme="auto">
    <header>
      <div>
        <h1>{{ session.labels.title }}</h1>
        <p>{{ session.labels.intro }}</p>
      </div>
      <div class="community-demo__actions">
        <button class="rv-btn-solid" (click)="save()">{{ session.labels.save }}</button>
        <button class="rv-btn-ghost" (click)="reload()">{{ session.labels.load }}</button>
      </div>
    </header>
    <p class="community-demo__status" role="status">{{ status }}</p>
    <revo-grid
      class="community-demo__grid"
      [source]="session.source"
      [plugins]="session.plugins"
      [kanban]="session.config"
      [kanbanToolbar]="session.toolbar"
      [theme]="theme"
      (aftergridinit)="captureGrid($event)"
    ></revo-grid>
  </section>`,
})
export class KanbanCommunityGridComponent {
  session = createCommunitySession(undefined, communityLanguage());
  status = this.session.labels.initial;
  theme = currentTheme().isDark() ? 'darkCompact' : 'compact';
  private grid?: HTMLRevoGridElement;
  private readonly disconnect = observeCurrentTheme((dark) => {
    this.theme = dark ? 'darkCompact' : 'compact';
    this.cdr.markForCheck();
  });
  @Input() set rows(rows: CommunityCard[] | undefined) {
    this.session = createCommunitySession(rows, communityLanguage());
    this.status = this.session.labels.initial;
  }
  constructor(private readonly cdr: ChangeDetectorRef) {}
  captureGrid(event: Event) {
    this.grid = event.target as HTMLRevoGridElement;
  }
  async save() {
    this.status = (await this.session.save(this.grid)) ?? this.status;
    this.cdr.markForCheck();
  }
  reload() {
    this.status = this.session.load(this.grid) ?? this.status;
  }
  ngOnDestroy() {
    this.disconnect();
  }
}
