<script setup lang="ts">
import { formatDuration } from '../composables/format'

defineProps<{
  keystrokes: number
  characters: number
  blocked: number
  elapsedMs: number
}>()
</script>

<template>
  <dl class="stats-bar" aria-label="Session stats">
    <div>
      <dt>Keystrokes</dt>
      <dd>{{ keystrokes }}</dd>
    </div>
    <div>
      <dt>Characters</dt>
      <dd>{{ characters }}</dd>
    </div>
    <div :class="{ warn: blocked > 0 }">
      <dt>Pastes blocked</dt>
      <dd>{{ blocked }}</dd>
    </div>
    <div>
      <dt>Time on task</dt>
      <dd>{{ formatDuration(elapsedMs) }}</dd>
    </div>
  </dl>
</template>

<style scoped>
.stats-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 20px;
  margin: 0;
  padding: 8px 14px;
  border-top: 1px solid var(--border);
  background: var(--surface-2);
  font-size: 12px;
}
.stats-bar div {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
dt {
  color: var(--text-muted);
}
dd {
  margin: 0;
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}
.warn dd {
  color: var(--warning);
}
</style>
