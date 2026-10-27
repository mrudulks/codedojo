<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ points: { date: number; wpm: number }[] }>()

const W = 220
const H = 56
const PAD = 4

const shape = computed(() => {
  const values = props.points.map((p) => p.wpm)
  const max = Math.max(...values, 10)
  const min = Math.min(...values, 0)
  const span = max - min || 1
  const step = values.length > 1 ? (W - PAD * 2) / (values.length - 1) : 0
  const coords = values.map(
    (v, i) => [PAD + i * step, H - PAD - ((v - min) / span) * (H - PAD * 2)] as const,
  )
  return {
    line: coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' '),
    last: coords[coords.length - 1],
  }
})

const summary = computed(() => {
  const values = props.points.map((p) => p.wpm)
  return `Typing speed over the last ${values.length} drills: ${values.join(', ')} words per minute`
})
</script>

<template>
  <svg
    class="sparkline"
    :viewBox="`0 0 ${W} ${H}`"
    role="img"
    :aria-label="summary"
    preserveAspectRatio="none"
  >
    <title>{{ summary }}</title>
    <polyline
      :points="shape.line"
      fill="none"
      stroke="var(--accent)"
      stroke-width="2"
      stroke-linejoin="round"
      stroke-linecap="round"
      vector-effect="non-scaling-stroke"
    />
    <circle
      v-if="shape.last"
      :cx="shape.last[0]"
      :cy="shape.last[1]"
      r="3.5"
      fill="var(--accent)"
    />
  </svg>
</template>

<style scoped>
.sparkline {
  width: 100%;
  height: 56px;
  overflow: visible;
}
</style>
