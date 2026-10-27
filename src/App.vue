<script setup lang="ts">
import { onMounted, ref, watchEffect } from 'vue'
import AppHeader from './components/AppHeader.vue'
import HomeView from './components/HomeView.vue'
import SettingsDialog from './components/SettingsDialog.vue'
import TaskSidebar from './components/TaskSidebar.vue'
import TaskView from './components/TaskView.vue'
import ToastHost from './components/ToastHost.vue'
import { useProgressStore } from './stores/progress'
import { useSettingsStore } from './stores/settings'
import { useTasksStore } from './stores/tasks'

const settingsStore = useSettingsStore()
const tasks = useTasksStore()
const progress = useProgressStore()
const settingsDialog = ref<InstanceType<typeof SettingsDialog>>()
const sidebarOpen = ref(false)

watchEffect(() => {
  document.documentElement.dataset.theme = settingsStore.resolvedTheme
})

onMounted(() => {
  void progress.load()
})
</script>

<template>
  <div class="app">
    <AppHeader
      @open-settings="settingsDialog?.open()"
      @toggle-sidebar="sidebarOpen = !sidebarOpen"
    />
    <div class="body">
      <div class="sidebar-wrap" :class="{ open: sidebarOpen }">
        <TaskSidebar @picked="sidebarOpen = false" />
      </div>
      <div v-if="sidebarOpen" class="scrim" aria-hidden="true" @click="sidebarOpen = false"></div>
      <main class="content">
        <HomeView v-if="tasks.view === 'home'" />
        <TaskView v-else />
      </main>
    </div>
    <SettingsDialog ref="settingsDialog" />
    <ToastHost />
  </div>
</template>

<style scoped>
.app {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  height: 100dvh;
}
.body {
  position: relative;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  min-height: 0;
}
.sidebar-wrap {
  min-height: 0;
  border-right: 1px solid var(--border);
}
.content {
  min-height: 0;
  min-width: 0;
  overflow-y: auto;
  background: var(--bg);
}
.scrim {
  display: none;
}
@media (max-width: 900px) {
  .body {
    grid-template-columns: minmax(0, 1fr);
  }
  .sidebar-wrap {
    position: absolute;
    inset: 0 auto 0 0;
    z-index: 20;
    width: min(320px, 86vw);
    transform: translateX(-100%);
    transition: transform 180ms ease;
  }
  .sidebar-wrap.open {
    transform: none;
    box-shadow: var(--shadow-lg);
  }
  .scrim {
    display: block;
    position: absolute;
    inset: 0;
    z-index: 10;
    background: rgb(0 0 0 / 0.3);
  }
}
</style>
