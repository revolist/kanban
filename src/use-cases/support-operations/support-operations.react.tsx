import KanbanUseCaseDemo from '../kanban-use-case-demo.react';
import { SUPPORT_OPERATIONS_SCENARIO } from './support-operations.data';
import './support-operations.scss';

export default function SupportOperationsUseCase() {
  return <KanbanUseCaseDemo scenario={SUPPORT_OPERATIONS_SCENARIO} />;
}
