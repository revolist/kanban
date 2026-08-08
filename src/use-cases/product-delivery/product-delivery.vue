<template>
  <KanbanUseCaseDemo :scenario="PRODUCT_DELIVERY_SCENARIO" />
</template>

<script setup lang="ts">
import KanbanUseCaseDemo from '../kanban-use-case-demo.vue';
import { PRODUCT_DELIVERY_SCENARIO } from './product-delivery.data';
import './product-delivery.scss';
</script>
