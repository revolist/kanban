<template>
  <KanbanUseCaseDemo :scenario="SALES_ONBOARDING_SCENARIO" />
</template>

<script setup lang="ts">
import KanbanUseCaseDemo from '../kanban-use-case-demo.vue';
import { SALES_ONBOARDING_SCENARIO } from './sales-onboarding.data';
import './sales-onboarding.scss';
</script>
