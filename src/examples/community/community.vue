<template>
  <section class="community-demo rv-native-controls" data-theme="auto">
    <header>
      <div>
        <h1>{{ session.labels.title }}</h1>
        <p>{{ session.labels.intro }}</p>
      </div>
      <div class="community-demo__actions">
        <button class="rv-btn-solid" @click="save">{{ session.labels.save }}</button>
        <button class="rv-btn-ghost" @click="reload">{{ session.labels.load }}</button>
      </div>
    </header>
    <p class="community-demo__status" role="status">{{ status }}</p>
    <RevoGrid
      class="community-demo__grid"
      :source="session.source"
      :plugins="session.plugins"
      :kanban.prop="session.config"
      :kanban-toolbar.prop="session.toolbar"
      :theme="theme"
      @aftergridinit="captureGrid"
    />
  </section>
</template>
<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import RevoGrid from '@revolist/vue3-datagrid';
import { currentTheme, observeCurrentTheme } from '../../theme';
import { createCommunitySession, communityLanguage, type CommunityCard } from './community.shared';
const props = defineProps<{ rows?: CommunityCard[] }>();
const session = createCommunitySession(props.rows, communityLanguage());
const status = ref(session.labels.initial);
const theme = ref(currentTheme().isDark() ? 'darkCompact' : 'compact');
let grid: HTMLRevoGridElement | undefined;
function captureGrid(event: CustomEvent) {
  grid = event.target as HTMLRevoGridElement;
}
async function save() {
  status.value = (await session.save(grid)) ?? status.value;
}
function reload() {
  status.value = session.load(grid) ?? status.value;
}
const disconnect = observeCurrentTheme((dark) => {
  theme.value = dark ? 'darkCompact' : 'compact';
});
onBeforeUnmount(disconnect);
</script>
