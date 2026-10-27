<script setup lang="ts">
import { computed, type Component } from 'vue'
import { LANGUAGE_LABELS } from '../languages'
import DrillMode from '../modes/DrillMode.vue'
import FixMode from '../modes/FixMode.vue'
import PredictMode from '../modes/PredictMode.vue'
import RefactorMode from '../modes/RefactorMode.vue'
import SolveMode from '../modes/SolveMode.vue'
import TranslateMode from '../modes/TranslateMode.vue'
import { useSettingsStore } from '../stores/settings'
import { useTasksStore } from '../stores/tasks'
import type { Mode } from '../tasks/schema'

const MODE_COMPONENTS: Record<Mode, Component> = {
  solve: SolveMode,
  fix: FixMode,
  predict: PredictMode,
  drill: DrillMode,
  translate: TranslateMode,
  refactor: RefactorMode,
}

const tasks = useTasksStore()
const { settings } = useSettingsStore()
const task = computed(() => tasks.selected)
const available = computed(() => task.value?.languages.includes(settings.language) ?? false)
</script>

<template>
  <div v-if="!task" class="placeholder">
    <p>Pick a task from the list to start typing.</p>
  </div>
  <div v-else-if="!available" class="placeholder">
    <p>
      <strong>{{ task.title }}</strong> is not available in
      {{ LANGUAGE_LABELS[settings.language] }}.
    </p>
    <div class="choices">
      <button
        v-for="lang in task.languages"
        :key="lang"
        type="button"
        class="btn"
        @click="settings.language = lang"
      >
        Switch to {{ LANGUAGE_LABELS[lang] }}
      </button>
    </div>
  </div>
  <component
    :is="MODE_COMPONENTS[task.mode]"
    v-else
    :key="task.mode"
    :task="task"
    :language="settings.language"
  />
</template>

<style scoped>
.placeholder {
  display: grid;
  place-content: center;
  gap: 14px;
  height: 100%;
  padding: 32px 16px;
  text-align: center;
  color: var(--text-muted);
}
.choices {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}
</style>
