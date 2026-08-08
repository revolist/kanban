<template>
  <section :class="['kanban-server-loading', { 'kanban-server-loading--dark': isDark }]">
    <p class="kanban-server-loading__notice" role="status" aria-live="polite">
      {{ notification }}
    </p>
    <RevoGrid
      class="kanban-server-loading__grid"
      hide-attribution
      resize
      :source="rows"
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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import RevoGrid, { type GridPlugin } from '@revolist/vue3-datagrid';
import { KanbanPlugin } from '@revolist/revogrid-enterprise';
import { currentTheme, observeCurrentTheme } from '../../theme';
import {
  createKanbanServerConfig,
  KANBAN_SERVER_COLUMNS,
  type ServerCard,
} from './kanban-server-loading.shared';
import './kanban-server-loading.scss';

const rows = ref<ServerCard[]>([]);
const notification = ref('Waiting for server…');
const isDark = ref(currentTheme().isDark());
const columns = KANBAN_SERVER_COLUMNS;
const plugins: GridPlugin[] = [KanbanPlugin];
const columnTypes = {};
const additionalData = computed(() => ({}));
const kanban = createKanbanServerConfig((message) => {
  notification.value = message;
});
let disconnectTheme: (() => void) | undefined;

onMounted(() => {
  disconnectTheme = observeCurrentTheme((value) => {
    isDark.value = value;
  });
});
onBeforeUnmount(() => disconnectTheme?.());
</script>
