<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import type { Language } from '../languages'
import type { TaskOf } from '../tasks/schema'
import { checkConstraints } from './constraints'
import TestedWorkspace from './TestedWorkspace.vue'

const props = defineProps<{ task: TaskOf<'refactor'>; language: Language }>()

const constraints = computed(() => props.task.constraints[props.language])
const meetsConstraints = (code: string) =>
  checkConstraints(code, constraints.value).every((c) => c.passed)
</script>

<template>
  <TestedWorkspace
    :task="task"
    :language="language"
    editor-title="Code to refactor"
    reset-label="Restore original"
    solved-title="Refactored: tests pass and every rule is met"
    :extra-check="meetsConstraints"
  >
    <template #results="{ code }">
      <section class="rules" aria-label="Refactor rules">
        <h2>Rules</h2>
        <ul>
          <li
            v-for="check in checkConstraints(code, constraints)"
            :key="check.label"
            :class="check.passed ? 'ok' : 'bad'"
          >
            <AppIcon :name="check.passed ? 'check' : 'cross'" :size="14" />
            <span>{{ check.label }}</span>
            <span v-if="check.detail" class="muted detail">{{ check.detail }}</span>
          </li>
          <li class="ok-neutral">
            <AppIcon name="list" :size="14" />
            <span>All tests still pass (checked when you run)</span>
          </li>
        </ul>
      </section>
    </template>
  </TestedWorkspace>
</template>

<style scoped>
.rules {
  display: grid;
  gap: 8px;
}
h2 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-muted);
}
ul {
  display: grid;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 13.5px;
}
li {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ok {
  color: var(--success);
}
.bad {
  color: var(--danger);
}
.ok-neutral {
  color: var(--text-muted);
}
.detail {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 12px;
}
</style>
