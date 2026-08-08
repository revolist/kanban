import { Component, ViewEncapsulation } from '@angular/core';
import { KanbanUseCaseDemoComponent } from '../kanban-use-case-demo.angular';
import { INTERNAL_WORKFLOWS_SCENARIO } from './internal-workflows.data';
import './internal-workflows.scss';

@Component({
  selector: 'kanban-internal-workflows-use-case',
  standalone: true,
  imports: [KanbanUseCaseDemoComponent],
  encapsulation: ViewEncapsulation.None,
  template: '<kanban-use-case-demo [scenario]="scenario"></kanban-use-case-demo>',
})
export class KanbanInternalWorkflowsUseCaseComponent {
  readonly scenario = INTERNAL_WORKFLOWS_SCENARIO;
}
