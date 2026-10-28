<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { LANGUAGE_LABELS, languageList } from '../languages'
import { LESSON_GROUPS, LESSON_GROUP_LABELS } from '../lessons/schema'
import { useLessonsStore } from '../stores/lessons'
import { useSettingsStore } from '../stores/settings'
import { useTasksStore } from '../stores/tasks'
import AppIcon from './AppIcon.vue'
import LessonArticle from './LessonArticle.vue'

const lessons = useLessonsStore()
const tasks = useTasksStore()
const { settings } = useSettingsStore()
const root = ref<HTMLElement>()

const groups = computed(() =>
  LESSON_GROUPS.map((group) => ({
    group,
    lessons: lessons.lessons.filter((l) => l.group === group),
  })).filter((g) => g.lessons.length > 0),
)

const lesson = computed(() => lessons.selected)
/** Lessons only shown for some languages fall back to their first language. */
const language = computed(() =>
  lesson.value && !lesson.value.languages.includes(settings.language)
    ? lesson.value.languages[0]!
    : settings.language,
)

const index = computed(() => lessons.lessons.findIndex((l) => l.id === lesson.value?.id))
const prev = computed(() => lessons.lessons[index.value - 1])
const next = computed(() => (index.value >= 0 ? lessons.lessons[index.value + 1] : undefined))

watch(
  () => lessons.selectedId,
  () => root.value?.parentElement?.scrollTo({ top: 0 }),
)
</script>

<template>
  <div ref="root" class="learn">
    <template v-if="!lesson">
      <header class="intro">
        <h1>Study notes</h1>
        <p class="muted">
          Short, plain explanations of the ideas behind the tasks. Every example shows exactly what
          it prints. Read one, then practise it.
        </p>
      </header>
      <section v-for="g in groups" :key="g.group" class="group">
        <h2>{{ LESSON_GROUP_LABELS[g.group] }}</h2>
        <ul class="cards">
          <li v-for="l in g.lessons" :key="l.id">
            <button type="button" class="card" @click="lessons.open(l.id)">
              <strong>{{ l.title }}</strong>
              <span class="muted">{{ l.summary }}</span>
              <span v-if="!l.languages.includes(settings.language)" class="only muted">
                {{ languageList(l.languages) }} only
              </span>
            </button>
          </li>
        </ul>
      </section>
    </template>

    <template v-else>
      <nav class="crumbs" aria-label="Lessons">
        <button type="button" class="btn btn-quiet" @click="lessons.open(null)">
          <AppIcon name="book" /> All notes
        </button>
        <button
          v-if="tasks.selected"
          type="button"
          class="btn btn-quiet"
          @click="tasks.open(tasks.selected.id)"
        >
          Back to “{{ tasks.selected.title }}”
        </button>
      </nav>
      <p v-if="language !== settings.language" class="note">
        This note is about {{ LANGUAGE_LABELS[language] }}, so its examples are in
        {{ LANGUAGE_LABELS[language] }}.
      </p>
      <LessonArticle :lesson="lesson" :language="language" />
      <nav class="pager" aria-label="More notes">
        <button v-if="prev" type="button" class="card" @click="lessons.open(prev.id)">
          <span class="muted">Previous</span>
          <strong>{{ prev.title }}</strong>
        </button>
        <span v-else></span>
        <button v-if="next" type="button" class="card next" @click="lessons.open(next.id)">
          <span class="muted">Next</span>
          <strong>{{ next.title }}</strong>
        </button>
      </nav>
    </template>
  </div>
</template>

<style scoped>
.learn {
  display: grid;
  gap: 24px;
  max-width: 760px;
  margin: 0 auto;
  padding: 28px 24px 56px;
}
.intro h1 {
  margin: 0 0 6px;
  font-size: 28px;
}
.intro p {
  margin: 0;
  line-height: 1.55;
}
.group {
  display: grid;
  gap: 10px;
}
.group h2 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
button.card {
  display: grid;
  align-content: start;
  gap: 4px;
  width: 100%;
  height: 100%;
  color: var(--text);
  font: inherit;
  text-align: left;
  line-height: 1.4;
  cursor: pointer;
}
button.card:hover {
  border-color: var(--accent);
}
.cards .muted {
  font-size: 13.5px;
}
.only {
  font-size: 12px !important;
}
.crumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: -8px;
}
.note {
  margin: 0;
  padding: 8px 12px;
  border-radius: var(--radius);
  background: var(--accent-soft);
  font-size: 14px;
}
.pager {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--border);
}
.pager .next {
  text-align: right;
}
@media (max-width: 600px) {
  .learn {
    padding: 16px 16px 40px;
  }
  .pager {
    grid-template-columns: 1fr;
  }
}
</style>
