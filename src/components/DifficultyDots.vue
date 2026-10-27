<script setup lang="ts">
defineProps<{ value: number }>()
</script>

<template>
  <span class="dots" :aria-label="`Difficulty ${value} of 5`" :title="`Difficulty ${value} of 5`">
    <span v-for="i in 5" :key="i" class="dot" :class="{ on: i <= value }"></span>
  </span>
</template>

<style scoped>
.dots {
  display: inline-flex;
  gap: 3px;
  margin-right: 4px;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--border);
}
.dot.on {
  background: var(--accent);
}
</style>
