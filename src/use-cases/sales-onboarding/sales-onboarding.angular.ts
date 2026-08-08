import { Component, ViewEncapsulation } from '@angular/core';
import { KanbanUseCaseDemoComponent } from '../kanban-use-case-demo.angular';
import { SALES_ONBOARDING_SCENARIO } from './sales-onboarding.data';
import './sales-onboarding.scss';

@Component({
  selector: 'kanban-sales-onboarding-use-case',
  standalone: true,
  imports: [KanbanUseCaseDemoComponent],
  encapsulation: ViewEncapsulation.None,
  template: '<kanban-use-case-demo [scenario]="scenario"></kanban-use-case-demo>',
})
export class KanbanSalesOnboardingUseCaseComponent {
  readonly scenario = SALES_ONBOARDING_SCENARIO;
}
