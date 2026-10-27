<script setup lang="ts">
import { formatDuration } from '../composables/format'
import AppIcon from './AppIcon.vue'

defineProps<{ title: string; elapsedMs: number; keystrokes: number; hintsUsed: number }>()
</script>

<template>
  <div class="banner" role="status">
    <span class="badge"><AppIcon name="check" :size="18" /></span>
    <div>
      <strong>{{ title }}</strong>
      <p>
        {{ formatDuration(elapsedMs) }} on task · {{ keystrokes }} keystrokes ·
        {{ hintsUsed === 0 ? 'no hints' : `${hintsUsed} hint${hintsUsed === 1 ? '' : 's'}` }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--radius);
  background: var(--success-soft);
  color: var(--success);
}
.badge {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--success);
  color: var(--surface);
}
strong {
  font-size: 15px;
}
p {
  margin: 2px 0 0;
  font-size: 12.5px;
  color: var(--text-muted);
}
</style>
