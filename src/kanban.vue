<template>
  <div class="kanban-showcase">
    <RevoGrid
      class="kanban-showcase__grid"
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
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import RevoGrid, { type GridPlugin } from '@revolist/vue3-datagrid';
import { KanbanPlugin } from '@revolist/revogrid-enterprise';
import { currentTheme, observeCurrentTheme } from './shared/theme';
import { createKanbanShowcaseConfig, KANBAN_SHOWCASE_COLUMNS, resolveKanbanRows, type KanbanShowcaseCard } from './kanban.shared';
import './kanban.scss';

const props = defineProps<{ rows?: KanbanShowcaseCard[] }>();
const isDark = ref(currentTheme().isDark());
let disconnectTheme: (() => void) | undefined;
const gridRows = ref(resolveKanbanRows(props.rows));
const columns = KANBAN_SHOWCASE_COLUMNS;
const plugins: GridPlugin[] = [KanbanPlugin];
const columnTypes = {};
const additionalData = computed(() => ({}));
const kanban = computed(() => createKanbanShowcaseConfig());

onMounted(() => {
  disconnectTheme = observeCurrentTheme((value) => {
    isDark.value = value;
  });
});
onBeforeUnmount(() => disconnectTheme?.());
</script>
