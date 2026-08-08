import { mountKanbanUseCase } from '../kanban-use-case-demo';
import { PRODUCT_DELIVERY_SCENARIO } from './product-delivery.data';
import './product-delivery.scss';

export function load(parentSelector: string): (() => void) | undefined {
  return mountKanbanUseCase(parentSelector, PRODUCT_DELIVERY_SCENARIO);
}
