import { Component, ViewEncapsulation } from '@angular/core';
import { KanbanUseCaseDemoComponent } from '../kanban-use-case-demo.angular';
import { PRODUCT_DELIVERY_SCENARIO } from './product-delivery.data';
import './product-delivery.scss';

@Component({
  selector: 'kanban-product-delivery-use-case',
  standalone: true,
  imports: [KanbanUseCaseDemoComponent],
  encapsulation: ViewEncapsulation.None,
  template: '<kanban-use-case-demo [scenario]="scenario"></kanban-use-case-demo>',
})
export class KanbanProductDeliveryUseCaseComponent {
  readonly scenario = PRODUCT_DELIVERY_SCENARIO;
}
