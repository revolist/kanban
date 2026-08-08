<template>
  <KanbanUseCaseDemo :scenario="INTERNAL_WORKFLOWS_SCENARIO" />
</template>

<script setup lang="ts">
import KanbanUseCaseDemo from '../kanban-use-case-demo.vue';
import { INTERNAL_WORKFLOWS_SCENARIO } from './internal-workflows.data';
import './internal-workflows.scss';
</script>
