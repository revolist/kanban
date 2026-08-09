<template>
  <section :class="shellClass" :aria-label="scenario.title">
    <header class="kanban-use-case-header">
      <div class="kanban-use-case-header__main">
        <div class="kanban-use-case-identity">
          <span class="kanban-use-case-eyebrow">{{ scenario.eyebrow }}</span>
          <strong class="kanban-use-case-title">{{ scenario.title }}</strong>
        </div>
        <div class="kanban-use-case-metrics">
          <div
            v-for="metric in scenario.metrics"
            :key="metric.label"
            :class="`kanban-use-case-metric kanban-use-case-metric--${metric.tone ?? 'neutral'}`"
          >
            <strong class="kanban-use-case-metric__value">{{ metric.value }}</strong>
            <span class="kanban-use-case-metric__label">{{ metric.label }}</span>
          </div>
        </div>
      </div>
      <div :class="`kanban-use-case-status kanban-use-case-status--${scenario.attention.tone}`">
          <span class="kanban-use-case-status__dot" aria-hidden="true" />
          <span><strong>{{ scenario.attention.label }}:</strong> {{ scenario.attention.detail }}</span>
      </div>
    </header>
    <RevoGrid
      class="kanban-use-case-grid"
      hide-attribution
      resize
      :source="gridRows"
      :columns="columns"
      :plugins="plugins"
      :column-types="columnTypes"
      :additional-data="additionalData"
      :kanban.prop="kanban"
      :theme="isDark ? 'darkCompact' : 'compact'"
    />
  </section>
</template>

<script setup lang="ts">
import './kanban-use-case-demo.scss';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import RevoGrid, { type GridPlugin } from '@revolist/vue3-datagrid';
import type { KanbanUseCaseScenario } from './kanban-use-case-model';
import { createKanbanUseCaseConfig, kanbanUseCaseShellClass, resolveKanbanUseCaseDark } from './kanban-use-case-model';
import { createKanbanUseCasePlugins } from './kanban-use-case-plugins';
import { currentTheme, observeCurrentTheme } from '../theme';

const props = defineProps<{ scenario: KanbanUseCaseScenario }>();
const gridRows = ref([...props.scenario.cards]);
const columns = [...props.scenario.columns];
const plugins: GridPlugin[] = createKanbanUseCasePlugins(props.scenario);
const columnTypes = {};
const additionalData = computed(() => ({}));
const kanban = computed(() => createKanbanUseCaseConfig(props.scenario));
const hostIsDark = ref(currentTheme().isDark());
const isDark = computed(() => resolveKanbanUseCaseDark(props.scenario, hostIsDark.value));
const shellClass = computed(() => kanbanUseCaseShellClass(props.scenario, hostIsDark.value));
let disconnectTheme: (() => void) | undefined;

onMounted(() => {
  disconnectTheme = observeCurrentTheme((dark) => {
    hostIsDark.value = dark;
  });
});
onBeforeUnmount(() => disconnectTheme?.());
</script>
