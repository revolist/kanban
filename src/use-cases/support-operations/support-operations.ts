import { mountKanbanUseCase } from '../kanban-use-case-demo';
import { SUPPORT_OPERATIONS_SCENARIO } from './support-operations.data';
import './support-operations.scss';

export function load(parentSelector: string): (() => void) | undefined {
  return mountKanbanUseCase(parentSelector, SUPPORT_OPERATIONS_SCENARIO);
}
