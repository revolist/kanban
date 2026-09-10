<template>
  <div class="kanban-board">
    <div v-if="recentlyCreated" class="kanban-board__recent-card" role="status">
      <span>Created card: <strong>{{ recentlyCreated.title }}</strong></span>
      <button type="button" @click="deleteRecentlyCreated">Delete recently created card</button>
    </div>
    <div v-if="recentlyMoved" class="kanban-board__recent-card" role="status">
      <span>Moved card: <strong>{{ recentlyMoved.card.title }}</strong></span>
      <button type="button" @click="restoreRecentlyMovedCard">Return recently moved card</button>
    </div>
    <RevoGrid class="kanban-board__grid" hide-attribution resize :source="gridRows" :columns="columns" :plugins="plugins" :column-types="columnTypes" :additional-data="additionalData" :kanban.prop="kanban" :kanban-card-editor-dialog.prop="editor" :theme="isDark ? 'darkCompact' : 'compact'" @kanbancardmove="syncMovedCards" @kanbancardcreate="trackCreatedCard" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import RevoGrid, { type GridPlugin } from '@revolist/vue3-datagrid';
import {
  KanbanCardEditorDialogPlugin,
  KanbanPlugin,
  type KanbanCardMoveDetail,
} from '@revolist/kanban';
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
const recentlyCreated = ref<KanbanBoardCard | null>(null);
const recentlyMoved = ref<{
  card: KanbanBoardCard;
  previous: KanbanBoardCard;
} | null>(null);

function syncMovedCards(event: CustomEvent<KanbanCardMoveDetail<KanbanBoardCard>>) {
  const changedCards = new Map(event.detail.changedCards.map((card) => [card.id, card]));
  gridRows.value = gridRows.value.map((card) => changedCards.get(card.id) ?? card);
  const card = event.detail.cards[0];
  const previous = event.detail.previousCards.find((item) => item.id === card?.id);
  if (card && previous) recentlyMoved.value = { card, previous };
}

function trackCreatedCard(event: CustomEvent<{ card: KanbanBoardCard; reason: string }>) {
  if (event.detail.reason === 'editor') recentlyCreated.value = event.detail.card;
}

function deleteRecentlyCreated() {
  const card = recentlyCreated.value;
  if (!card) return;
  gridRows.value = gridRows.value.filter((item) => item.id !== card.id);
  recentlyCreated.value = null;
}

function restoreRecentlyMovedCard() {
  const moved = recentlyMoved.value;
  if (!moved) return;
  gridRows.value = gridRows.value.map((card) =>
    card.id === moved.previous.id ? moved.previous : card,
  );
  recentlyMoved.value = null;
}

onMounted(() => {
  disconnectTheme = observeCurrentTheme((value) => {
    isDark.value = value;
  });
});
onBeforeUnmount(() => disconnectTheme?.());
</script>
