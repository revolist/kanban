import { Component, ViewEncapsulation } from '@angular/core';
import { KanbanUseCaseDemoComponent } from '../kanban-use-case-demo.angular';
import { QUALITY_MANUFACTURING_SCENARIO } from './quality-manufacturing.data';
import './quality-manufacturing.scss';

@Component({
  selector: 'kanban-quality-manufacturing-use-case',
  standalone: true,
  imports: [KanbanUseCaseDemoComponent],
  encapsulation: ViewEncapsulation.None,
  template: '<kanban-use-case-demo [scenario]="scenario"></kanban-use-case-demo>',
})
export class KanbanQualityManufacturingUseCaseComponent {
  readonly scenario = QUALITY_MANUFACTURING_SCENARIO;
}
