<script setup lang="ts">
import { computed } from 'vue'
import { useLessonsStore } from '../stores/lessons'
import { useSettingsStore, type ThemeChoice } from '../stores/settings'
import { useTasksStore } from '../stores/tasks'
import AppIcon, { type IconName } from './AppIcon.vue'
import LanguageSwitcher from './LanguageSwitcher.vue'

const emit = defineEmits<{ openSettings: []; toggleSidebar: [] }>()
const { settings } = useSettingsStore()
const tasks = useTasksStore()
const lessons = useLessonsStore()

/** Languages the current page can show; undefined means all. */
const availableLanguages = computed(() => {
  if (tasks.view === 'task') return tasks.selected?.languages
  if (tasks.view === 'learn') return lessons.selected?.languages
  return undefined
})

const NEXT_THEME: Record<ThemeChoice, ThemeChoice> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
}
const THEME_ICON: Record<ThemeChoice, IconName> = { system: 'monitor', light: 'sun', dark: 'moon' }
const themeLabel = computed(() => `Theme: ${settings.theme} (click to change)`)
</script>

<template>
  <header class="app-header">
    <button class="icon-btn sidebar-toggle" aria-label="Show tasks" @click="emit('toggleSidebar')">
      <AppIcon name="menu" />
    </button>
    <button class="brand" type="button" @click="tasks.goHome()">
      <span class="logo" aria-hidden="true">C<span class="caret"></span></span>
      <span class="name">Code Dojo</span>
    </button>
    <nav aria-label="Main">
      <button type="button" :class="{ active: tasks.view === 'home' }" @click="tasks.goHome()">
        <AppIcon name="home" /> <span>Today</span>
      </button>
      <button
        type="button"
        :class="{ active: tasks.view === 'task' }"
        :disabled="!tasks.selected"
        @click="tasks.selected && tasks.open(tasks.selected.id)"
      >
        <AppIcon name="list" /> <span>Practice</span>
      </button>
      <button type="button" :class="{ active: tasks.view === 'learn' }" @click="lessons.open(null)">
        <AppIcon name="book" /> <span>Learn</span>
      </button>
    </nav>
    <div class="spacer"></div>
    <LanguageSwitcher v-model="settings.language" :available="availableLanguages" />
    <button
      class="icon-btn"
      :aria-label="themeLabel"
      :title="themeLabel"
      @click="settings.theme = NEXT_THEME[settings.theme]"
    >
      <AppIcon :name="THEME_ICON[settings.theme]" />
    </button>
    <button class="icon-btn" aria-label="Settings" title="Settings" @click="emit('openSettings')">
      <AppIcon name="settings" />
    </button>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 56px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--text);
  font: inherit;
  cursor: pointer;
}
.logo {
  position: relative;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: var(--ink);
  color: var(--accent);
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 16px;
  box-shadow: inset 0 -3px 0 rgb(0 0 0 / 0.25);
}
.caret {
  position: absolute;
  right: 6px;
  bottom: 7px;
  width: 4px;
  height: 2px;
  background: var(--accent);
  animation: blink 1.1s steps(1) infinite;
}
@keyframes blink {
  50% {
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .caret {
    animation: none;
  }
}
.name {
  font-weight: 600;
  font-size: 16px;
  letter-spacing: -0.01em;
}
nav {
  display: flex;
  gap: 2px;
  margin-left: 12px;
}
nav button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}
nav button:hover:not(:disabled) {
  color: var(--text);
  background: var(--surface-2);
}
nav button.active {
  color: var(--text);
  background: var(--surface-2);
}
nav button:disabled {
  opacity: 0.4;
  cursor: default;
}
.spacer {
  flex: 1;
}
.sidebar-toggle {
  display: none;
}
@media (max-width: 900px) {
  .sidebar-toggle {
    display: grid;
  }
  .app-header {
    gap: 8px;
    padding: 0 10px;
  }
  nav {
    margin-left: 0;
  }
  nav span,
  .name {
    display: none;
  }
}
@media (max-width: 520px) {
  nav {
    display: none;
  }
}
</style>
