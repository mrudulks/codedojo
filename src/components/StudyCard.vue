<script setup lang="ts">
import { computed } from 'vue'
import { useLessonsStore } from '../stores/lessons'
import AppIcon from './AppIcon.vue'

const lessons = useLessonsStore()
const featured = computed(() => lessons.lessons.slice(0, 6))
</script>

<template>
  <section class="study card" aria-labelledby="study-title">
    <header>
      <div>
        <h2 id="study-title">Study notes</h2>
        <p class="muted">Plain explanations with small examples. Read one before you practise.</p>
      </div>
      <button type="button" class="btn" @click="lessons.open(null)">
        <AppIcon name="book" /> All {{ lessons.lessons.length }} notes
      </button>
    </header>
    <ul>
      <li v-for="l in featured" :key="l.id">
        <button type="button" @click="lessons.open(l.id)">{{ l.title }}</button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.study {
  display: grid;
  gap: 12px;
}
header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
h2 {
  margin: 0 0 4px;
  font-size: 18px;
}
header p {
  margin: 0;
}
ul {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
li button {
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--text);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}
li button:hover {
  border-color: var(--accent);
}
</style>
