<template>
  <div class="kanban-board">
    <RevoGrid class="kanban-board__grid" hide-attribution resize :source="gridRows" :columns="columns" :plugins="plugins" :column-types="columnTypes" :additional-data="additionalData" :kanban.prop="kanban" :kanban-card-editor-dialog.prop="editor" :theme="isDark ? 'darkCompact' : 'compact'" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import RevoGrid, { type GridPlugin } from '@revolist/vue3-datagrid';
import { KanbanCardEditorDialogPlugin, KanbanPlugin } from '@revolist/revogrid-enterprise';
import { currentTheme, observeCurrentTheme } from '../../theme';
import { createKanbanBoardConfig, createKanbanBoardEditor, KANBAN_BOARD_COLUMNS, resolveKanbanBoardRows, type KanbanBoardCard } from './kanban-board-data';
import './kanban-board.scss';

const props = defineProps<{ rows?: KanbanBoardCard[] }>();
const isDark = ref(currentTheme().isDark());
let disconnectTheme: (() => void) | undefined;
const gridRows = ref(resolveKanbanBoardRows(props.rows));
const columns = KANBAN_BOARD_COLUMNS;
const plugins: GridPlugin[] = [KanbanPlugin, KanbanCardEditorDialogPlugin];
const columnTypes = {};
const additionalData = computed(() => ({}));
const kanban = computed(() => createKanbanBoardConfig());
const editor = createKanbanBoardEditor();

onMounted(() => {
  disconnectTheme = observeCurrentTheme((value) => {
    isDark.value = value;
  });
});
onBeforeUnmount(() => disconnectTheme?.());
</script>
