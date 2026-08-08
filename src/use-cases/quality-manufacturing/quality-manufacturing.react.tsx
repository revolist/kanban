import KanbanUseCaseDemo from '../kanban-use-case-demo.react';
import { QUALITY_MANUFACTURING_SCENARIO } from './quality-manufacturing.data';
import './quality-manufacturing.scss';

export default function QualityManufacturingUseCase() {
  return <KanbanUseCaseDemo scenario={QUALITY_MANUFACTURING_SCENARIO} />;
}
