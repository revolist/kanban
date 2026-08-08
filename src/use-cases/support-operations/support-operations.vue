<template>
  <KanbanUseCaseDemo :scenario="SUPPORT_OPERATIONS_SCENARIO" />
</template>

<script setup lang="ts">
import KanbanUseCaseDemo from '../kanban-use-case-demo.vue';
import { SUPPORT_OPERATIONS_SCENARIO } from './support-operations.data';
import './support-operations.scss';
</script>
