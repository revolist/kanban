import { Component, ViewEncapsulation } from '@angular/core';
import { KanbanUseCaseDemoComponent } from '../kanban-use-case-demo.angular';
import { SUPPORT_OPERATIONS_SCENARIO } from './support-operations.data';

@Component({
  selector: 'kanban-support-operations-use-case',
  standalone: true,
  imports: [KanbanUseCaseDemoComponent],
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./support-operations.scss'],
  template: '<kanban-use-case-demo [scenario]="scenario"></kanban-use-case-demo>',
})
export class KanbanSupportOperationsUseCaseComponent {
  readonly scenario = SUPPORT_OPERATIONS_SCENARIO;
}
