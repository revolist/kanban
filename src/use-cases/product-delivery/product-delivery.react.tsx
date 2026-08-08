import KanbanUseCaseDemo from '../kanban-use-case-demo.react';
import { PRODUCT_DELIVERY_SCENARIO } from './product-delivery.data';
import './product-delivery.scss';

export default function ProductDeliveryUseCase() {
  return <KanbanUseCaseDemo scenario={PRODUCT_DELIVERY_SCENARIO} />;
}
