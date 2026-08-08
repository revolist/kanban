<template>
  <KanbanUseCaseDemo :scenario="CONTENT_APPROVALS_SCENARIO" />
</template>

<script setup lang="ts">
import './content-approvals.scss';
import KanbanUseCaseDemo from '../kanban-use-case-demo.vue';
import { CONTENT_APPROVALS_SCENARIO } from './content-approvals.data';
</script>
