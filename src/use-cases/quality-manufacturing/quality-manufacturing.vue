<template>
  <KanbanUseCaseDemo :scenario="QUALITY_MANUFACTURING_SCENARIO" />
</template>

<script setup lang="ts">
import KanbanUseCaseDemo from '../kanban-use-case-demo.vue';
import { QUALITY_MANUFACTURING_SCENARIO } from './quality-manufacturing.data';
import './quality-manufacturing.scss';
</script>
