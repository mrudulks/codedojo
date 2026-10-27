<script setup lang="ts">
import { computed } from 'vue'
import { LANGUAGE_LABELS, type Language } from '../languages'
import { MODE_LABELS, type Task } from '../tasks/schema'
import AppIcon from './AppIcon.vue'
import DifficultyDots from './DifficultyDots.vue'
import RichText from './RichText.vue'

const props = defineProps<{
  task: Task
  language: Language
  hintsShown: number
  solved: boolean
}>()

const emit = defineEmits<{ revealHint: [] }>()

const hints = computed(() => props.task.hints ?? [])
</script>

<template>
  <section class="brief" aria-labelledby="brief-title">
    <p class="eyebrow">
      {{ MODE_LABELS[task.mode] }} · {{ LANGUAGE_LABELS[language] }}
      <span v-if="solved" class="solved-chip"><AppIcon name="check" :size="12" /> Solved</span>
    </p>
    <h1 id="brief-title">{{ task.title }}</h1>
    <div class="meta">
      <DifficultyDots :value="task.difficulty" />
      <span v-for="tag in task.tags" :key="tag" class="tag">{{ tag }}</span>
    </div>
    <p class="prompt"><RichText :text="task.prompt" /></p>
    <slot />
    <div v-if="hints.length > 0" class="hints">
      <ol v-if="hintsShown > 0">
        <li v-for="(hint, i) in hints.slice(0, hintsShown)" :key="i"><RichText :text="hint" /></li>
      </ol>
      <button
        v-if="hintsShown < hints.length"
        type="button"
        class="btn btn-quiet"
        @click="emit('revealHint')"
      >
        <AppIcon name="bulb" />
        {{ hintsShown === 0 ? 'Show a hint' : 'Show another hint' }}
        <span class="muted">({{ hintsShown }}/{{ hints.length }})</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.brief {
  display: grid;
  gap: 10px;
}
.eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
h1 {
  margin: 0;
  font-size: 22px;
  line-height: 1.2;
}
.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.prompt {
  margin: 0;
  line-height: 1.6;
}
.hints ol {
  margin: 0 0 8px;
  padding: 10px 12px 10px 30px;
  border-left: 3px solid var(--accent);
  background: var(--accent-soft);
  border-radius: 0 var(--radius) var(--radius) 0;
  line-height: 1.5;
}
.hints li + li {
  margin-top: 6px;
}
.solved-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--success-soft);
  color: var(--success);
  text-transform: none;
  letter-spacing: 0;
}
</style>
