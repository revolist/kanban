import './content-approvals.scss';
import { Component, ViewEncapsulation } from '@angular/core';
import { KanbanUseCaseDemoComponent } from '../kanban-use-case-demo.angular';
import { CONTENT_APPROVALS_SCENARIO } from './content-approvals.data';

@Component({
  selector: 'kanban-content-approvals-use-case',
  standalone: true,
  imports: [KanbanUseCaseDemoComponent],
  encapsulation: ViewEncapsulation.None,
  template: '<kanban-use-case-demo [scenario]="scenario"></kanban-use-case-demo>',
})
export class KanbanContentApprovalsUseCaseComponent {
  readonly scenario = CONTENT_APPROVALS_SCENARIO;
}
