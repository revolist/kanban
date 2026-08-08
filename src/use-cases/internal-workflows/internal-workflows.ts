import { mountKanbanUseCase } from '../kanban-use-case-demo';
import { INTERNAL_WORKFLOWS_SCENARIO } from './internal-workflows.data';
import './internal-workflows.scss';

export function load(parentSelector: string): (() => void) | undefined {
  return mountKanbanUseCase(parentSelector, INTERNAL_WORKFLOWS_SCENARIO);
}
