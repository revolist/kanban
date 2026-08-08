import KanbanUseCaseDemo from '../kanban-use-case-demo.react';
import { INTERNAL_WORKFLOWS_SCENARIO } from './internal-workflows.data';
import './internal-workflows.scss';

export default function InternalWorkflowsUseCase() {
  return <KanbanUseCaseDemo scenario={INTERNAL_WORKFLOWS_SCENARIO} />;
}
