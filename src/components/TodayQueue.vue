<script setup lang="ts">
import { computed } from 'vue'
import { LANGUAGE_LABELS } from '../languages'
import type { QueueItem } from '../progress/scheduler'
import { useProgressStore } from '../stores/progress'
import { useSettingsStore } from '../stores/settings'
import { useTasksStore } from '../stores/tasks'
import { MODE_LABELS } from '../tasks/schema'
import AppIcon from './AppIcon.vue'
import DifficultyDots from './DifficultyDots.vue'

const progress = useProgressStore()
const tasks = useTasksStore()
const { settings } = useSettingsStore()

const queue = computed(() => progress.queue(settings.language))
const reviews = computed(() => queue.value.filter((q) => q.reason === 'review').length)

const OUTCOME_TEXT: Record<string, string> = {
  failed: 'Last time it did not pass',
  hinted: 'Last time you used hints',
  clean: 'Spaced review',
}

function detail(item: QueueItem): string {
  if (item.reason === 'review') return OUTCOME_TEXT[item.detail] ?? 'Review'
  return item.detail ? `New · your weakest tag is “${item.detail}”` : 'New task'
}

function start(item: QueueItem) {
  settings.language = item.language
  tasks.open(item.task.id)
}
</script>

<template>
  <section class="queue card" aria-labelledby="today-title">
    <header>
      <h2 id="today-title">Today</h2>
      <p class="muted">
        <template v-if="reviews > 0"
          >{{ reviews }} review{{ reviews === 1 ? '' : 's' }} due, then something new.</template
        >
        <template v-else>Nothing due for review. Here is something new.</template>
      </p>
    </header>
    <p v-if="!progress.loaded" class="muted">Loading your progress…</p>
    <p v-else-if="queue.length === 0" class="muted">
      You have tried every task. Reviews will show up here when they are due.
    </p>
    <ol v-else>
      <li v-for="item in queue" :key="`${item.task.id}|${item.language}`">
        <button type="button" @click="start(item)">
          <span class="kind" :class="item.reason">{{
            item.reason === 'review' ? 'Review' : 'New'
          }}</span>
          <span class="text">
            <strong>{{ item.task.title }}</strong>
            <span class="muted">
              {{ MODE_LABELS[item.task.mode] }} · {{ LANGUAGE_LABELS[item.language] }} ·
              {{ detail(item) }}
            </span>
          </span>
          <DifficultyDots :value="item.task.difficulty" />
          <AppIcon name="arrow-right" />
        </button>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.queue {
  display: grid;
  gap: 14px;
}
header h2 {
  margin: 0;
  font-size: 22px;
}
header p {
  margin: 4px 0 0;
}
ol {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
li button {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 120ms ease,
    transform 120ms ease;
}
li button:hover {
  border-color: var(--accent);
}
li button:active {
  transform: translateY(1px);
}
.kind {
  flex: none;
  width: 64px;
  padding: 3px 0;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 600;
  text-align: center;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.kind.review {
  background: var(--accent-soft);
  color: var(--accent);
}
.kind.new {
  background: var(--success-soft);
  color: var(--success);
}
.text {
  display: grid;
  gap: 2px;
  flex: 1;
  min-width: 0;
}
.text .muted {
  font-size: 12.5px;
}
@media (max-width: 560px) {
  li button {
    flex-wrap: wrap;
    gap: 8px 12px;
  }
  .text {
    flex-basis: calc(100% - 80px);
  }
}
</style>
