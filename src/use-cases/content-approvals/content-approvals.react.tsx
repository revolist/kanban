import './content-approvals.scss';
import KanbanUseCaseDemo from '../kanban-use-case-demo.react';
import { CONTENT_APPROVALS_SCENARIO } from './content-approvals.data';

export default function ContentApprovalsUseCase() {
  return <KanbanUseCaseDemo scenario={CONTENT_APPROVALS_SCENARIO} />;
}
