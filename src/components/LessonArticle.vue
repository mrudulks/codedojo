<script setup lang="ts">
import { computed } from 'vue'
import { LANGUAGE_LABELS, languageList, type Language } from '../languages'
import { exampleFor, sectionLanguages, type Lesson } from '../lessons/schema'
import { useProgressStore } from '../stores/progress'
import { useSettingsStore } from '../stores/settings'
import { useTasksStore } from '../stores/tasks'
import { MODE_LABELS, type Task } from '../tasks/schema'
import AppIcon from './AppIcon.vue'
import CodeBlock from './CodeBlock.vue'
import DifficultyDots from './DifficultyDots.vue'
import ProseBlocks from './ProseBlocks.vue'
import RichText from './RichText.vue'

const props = defineProps<{ lesson: Lesson; language: Language }>()

const tasks = useTasksStore()
const progress = useProgressStore()
const { settings } = useSettingsStore()

const sections = computed(() =>
  props.lesson.sections
    .filter((s) => sectionLanguages(props.lesson, s).includes(props.language))
    .map((s) => ({ ...s, shown: exampleFor(s, props.language) })),
)

const practice = computed(() =>
  tasks.tasks.filter((t) => t.tags.some((tag) => props.lesson.tags.includes(tag))),
)

function practise(task: Task) {
  if (!task.languages.includes(settings.language)) settings.language = task.languages[0]!
  tasks.open(task.id)
}
</script>

<template>
  <article class="lesson" :aria-labelledby="`lesson-${lesson.id}`">
    <header>
      <h1 :id="`lesson-${lesson.id}`">{{ lesson.title }}</h1>
      <p class="summary"><RichText :text="lesson.summary" /></p>
    </header>

    <section v-for="(s, i) in sections" :key="i" class="section">
      <h2>{{ s.heading }}</h2>
      <ProseBlocks :paragraphs="s.body" />
      <template v-if="s.shown">
        <p v-if="s.shown.sharedFrom" class="shared muted">
          Shown in {{ LANGUAGE_LABELS[s.shown.language] }}; it works the same way in
          {{ LANGUAGE_LABELS[language] }}.
        </p>
        <CodeBlock
          :code="s.shown.example.code"
          :language="s.shown.language"
          :output="s.shown.example.output"
        />
      </template>
    </section>

    <section v-if="lesson.mistakes?.length" class="section mistakes">
      <h2>Common mistakes</h2>
      <ul>
        <li v-for="(m, i) in lesson.mistakes" :key="i"><RichText :text="m" /></li>
      </ul>
    </section>

    <section v-if="practice.length > 0" class="section">
      <h2>Practise it</h2>
      <ul class="practice">
        <li v-for="task in practice" :key="task.id">
          <button type="button" @click="practise(task)">
            <span class="text">
              <strong>{{ task.title }}</strong>
              <span class="muted">
                {{ MODE_LABELS[task.mode] }}
                <template v-if="!task.languages.includes(language)">
                  · {{ languageList(task.languages) }} only
                </template>
              </span>
            </span>
            <AppIcon
              v-if="progress.isSolved(task.id, language)"
              class="solved"
              name="check"
              :size="14"
            />
            <DifficultyDots :value="task.difficulty" />
            <AppIcon name="arrow-right" />
          </button>
        </li>
      </ul>
    </section>
  </article>
</template>

<style scoped>
.lesson {
  display: grid;
  gap: 28px;
}
header {
  display: grid;
  gap: 8px;
}
h1 {
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
  letter-spacing: -0.01em;
}
.summary {
  margin: 0;
  color: var(--text-muted);
  font-size: 17px;
  line-height: 1.5;
}
.section {
  display: grid;
  gap: 12px;
  line-height: 1.65;
}
.section h2 {
  margin: 0;
  font-size: 19px;
}
.section :deep(p),
.section :deep(ul) {
  margin: 0;
}
.section :deep(ul) {
  padding-left: 22px;
}
.section :deep(li + li) {
  margin-top: 4px;
}
.shared {
  font-size: 13px;
}
.mistakes ul {
  padding: 12px 14px 12px 32px;
  border-left: 3px solid var(--warning);
  border-radius: 0 var(--radius) var(--radius) 0;
  background: var(--warning-soft);
}
.practice {
  display: grid;
  gap: 6px;
  padding: 0 !important;
  list-style: none;
}
.practice li + li {
  margin-top: 0;
}
.practice button {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.practice button:hover {
  border-color: var(--accent);
}
.practice .text {
  display: grid;
  flex: 1;
  min-width: 0;
  line-height: 1.35;
}
.practice .muted {
  font-size: 13px;
}
.solved {
  color: var(--success);
}
</style>
