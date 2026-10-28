<script setup lang="ts">
import { computed } from 'vue'
import { useLessonsStore } from '../stores/lessons'
import AppIcon from './AppIcon.vue'

const props = defineProps<{ tags: string[] }>()
const lessons = useLessonsStore()
const related = computed(() => lessons.forTags(props.tags))
</script>

<template>
  <p v-if="related.length > 0" class="lesson-links">
    <AppIcon name="book" :size="14" />
    <span class="muted">Study notes:</span>
    <button v-for="l in related" :key="l.id" type="button" @click="lessons.open(l.id)">
      {{ l.title }}
    </button>
  </p>
</template>

<style scoped>
.lesson-links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  margin: 0;
  font-size: 14px;
  color: var(--text-muted);
}
button {
  padding: 0;
  border: 0;
  background: none;
  color: var(--accent);
  font: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
}
button:hover {
  text-decoration-thickness: 2px;
}
</style>
