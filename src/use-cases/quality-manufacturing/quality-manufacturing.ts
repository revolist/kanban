import { mountKanbanUseCase } from '../kanban-use-case-demo';
import { QUALITY_MANUFACTURING_SCENARIO } from './quality-manufacturing.data';
import './quality-manufacturing.scss';

export function load(parentSelector: string): (() => void) | undefined {
  return mountKanbanUseCase(parentSelector, QUALITY_MANUFACTURING_SCENARIO);
}
