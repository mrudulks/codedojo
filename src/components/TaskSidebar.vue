<script setup lang="ts">
import { computed } from 'vue'
import { LANGUAGE_LABELS } from '../languages'
import { useProgressStore } from '../stores/progress'
import { useSettingsStore } from '../stores/settings'
import { useTasksStore } from '../stores/tasks'
import { MODE_LABELS } from '../tasks/schema'
import AppIcon from './AppIcon.vue'
import DifficultyDots from './DifficultyDots.vue'

const emit = defineEmits<{ picked: [] }>()
const tasks = useTasksStore()
const progress = useProgressStore()
const { settings } = useSettingsStore()

const groups = computed(() => tasks.grouped(settings.language))
const visibleCount = computed(() => groups.value.reduce((n, g) => n + g.tasks.length, 0))

function pick(id: string) {
  tasks.open(id)
  emit('picked')
}
</script>

<template>
  <nav class="sidebar" aria-label="Tasks">
    <div class="filters">
      <input
        v-model="tasks.filters.query"
        class="input"
        type="search"
        placeholder="Search tasks or tags"
        aria-label="Search tasks"
      />
      <div class="row">
        <select v-model="tasks.filters.difficulty" class="select" aria-label="Difficulty">
          <option :value="null">Any difficulty</option>
          <option v-for="d in 5" :key="d" :value="d">Difficulty {{ d }}</option>
        </select>
        <select v-model="tasks.filters.tag" class="select" aria-label="Tag">
          <option :value="null">Any tag</option>
          <option v-for="tag in tasks.allTags" :key="tag" :value="tag">{{ tag }}</option>
        </select>
      </div>
      <label class="check">
        <input v-model="tasks.filters.languageOnly" type="checkbox" />
        Only {{ LANGUAGE_LABELS[settings.language] }} tasks
      </label>
    </div>

    <div class="groups">
      <p v-if="visibleCount === 0" class="muted empty">No tasks match these filters.</p>
      <section v-for="group in groups" :key="group.mode">
        <h2>
          {{ MODE_LABELS[group.mode] }} <span>{{ group.tasks.length }}</span>
        </h2>
        <ul>
          <li v-for="task in group.tasks" :key="task.id">
            <button
              type="button"
              :class="{ active: tasks.view === 'task' && tasks.selectedId === task.id }"
              :aria-current="tasks.selectedId === task.id ? 'true' : undefined"
              @click="pick(task.id)"
            >
              <span class="solved" :class="{ on: progress.isSolved(task.id, settings.language) }">
                <AppIcon
                  v-if="progress.isSolved(task.id, settings.language)"
                  name="check"
                  :size="12"
                />
                <span v-else class="sr-only">Not solved</span>
              </span>
              <span class="title">{{ task.title }}</span>
              <DifficultyDots :value="task.difficulty" />
            </button>
          </li>
        </ul>
      </section>
    </div>

    <p v-if="tasks.loadErrors.length" class="load-errors" role="alert">
      {{ tasks.loadErrors.length }} task file(s) failed validation; see the console.
    </p>
  </nav>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  background: var(--surface);
}
.filters {
  display: grid;
  gap: 8px;
  padding: 14px;
  border-bottom: 1px solid var(--border);
}
.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-muted);
}
.check input {
  accent-color: var(--accent);
}
.groups {
  flex: 1;
  overflow-y: auto;
  padding: 8px 8px 16px;
}
.empty {
  padding: 12px;
  font-size: 13px;
}
h2 {
  display: flex;
  justify-content: space-between;
  margin: 14px 8px 6px;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}
h2 span {
  font-family: var(--font-mono);
  font-weight: 400;
}
ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
li button {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 7px 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}
li button:hover {
  background: var(--surface-2);
}
li button.active {
  background: var(--accent-soft);
  color: var(--text);
}
.title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.solved {
  flex: none;
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid var(--border);
}
.solved.on {
  border-color: var(--success);
  background: var(--success);
  color: var(--surface);
}
.load-errors {
  margin: 0;
  padding: 10px 14px;
  font-size: 12px;
  color: var(--danger);
  border-top: 1px solid var(--border);
}
</style>
