import './content-approvals.scss';
import { mountKanbanUseCase } from '../kanban-use-case-demo';
import { CONTENT_APPROVALS_SCENARIO } from './content-approvals.data';

export function load(parentSelector: string): (() => void) | undefined {
  return mountKanbanUseCase(parentSelector, CONTENT_APPROVALS_SCENARIO);
}
