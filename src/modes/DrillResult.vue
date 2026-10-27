<script setup lang="ts">
import AppIcon from '../components/AppIcon.vue'
import { formatDuration } from '../composables/format'
import type { DrillStats } from './drill'

defineProps<{ result: DrillStats & { timeMs: number } }>()
const emit = defineEmits<{ restart: [] }>()
</script>

<template>
  <section class="drill-result" aria-label="Drill result" role="status">
    <h2>Drill complete</h2>
    <div class="figures">
      <div class="figure">
        <span class="value">{{ result.wpm }}</span>
        <span class="label">words per minute</span>
      </div>
      <div class="figure">
        <span class="value">{{ Math.round(result.accuracy * 100) }}%</span>
        <span class="label">accuracy</span>
      </div>
      <div class="figure">
        <span class="value">{{ result.mistakes }}</span>
        <span class="label">mistakes</span>
      </div>
      <div class="figure">
        <span class="value">{{ formatDuration(result.timeMs) }}</span>
        <span class="label">time</span>
      </div>
    </div>
    <button type="button" class="btn btn-primary" @click="emit('restart')">
      <AppIcon name="reset" /> Go again
    </button>
  </section>
</template>

<style scoped>
.drill-result {
  display: grid;
  gap: 14px;
  padding: 16px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  background: var(--surface-2);
}
h2 {
  margin: 0;
  font-size: 15px;
}
.figures {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.figure {
  display: grid;
}
.value {
  font-family: var(--font-mono);
  font-size: 26px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--accent);
}
.label {
  font-size: 12px;
  color: var(--text-muted);
}
.btn {
  justify-self: start;
}
</style>
