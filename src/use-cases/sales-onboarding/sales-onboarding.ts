import { mountKanbanUseCase } from '../kanban-use-case-demo';
import { SALES_ONBOARDING_SCENARIO } from './sales-onboarding.data';
import './sales-onboarding.scss';

export function load(parentSelector: string): (() => void) | undefined {
  return mountKanbanUseCase(parentSelector, SALES_ONBOARDING_SCENARIO);
}
