import KanbanUseCaseDemo from '../kanban-use-case-demo.react';
import { SALES_ONBOARDING_SCENARIO } from './sales-onboarding.data';
import './sales-onboarding.scss';

export default function SalesOnboardingUseCase() {
  return <KanbanUseCaseDemo scenario={SALES_ONBOARDING_SCENARIO} />;
}
