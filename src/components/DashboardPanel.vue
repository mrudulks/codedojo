<script setup lang="ts">
import { computed } from 'vue'
import { formatDuration } from '../composables/format'
import { LANGUAGES, LANGUAGE_LABELS } from '../languages'
import { useProgressStore } from '../stores/progress'
import { useTasksStore } from '../stores/tasks'
import WpmSparkline from './WpmSparkline.vue'

const progress = useProgressStore()
const tasks = useTasksStore()
const dash = computed(() => progress.dashboard)

const totals = computed(() =>
  Object.fromEntries(
    LANGUAGES.map((l) => [
      l,
      tasks.tasks.filter((t) => t.languages.includes(l) && t.mode !== 'drill').length,
    ]),
  ),
)
const lastWpm = computed(() => dash.value.wpmTrend.at(-1)?.wpm)
</script>

<template>
  <section class="dashboard" aria-labelledby="dash-title">
    <h2 id="dash-title" class="section-title">Progress</h2>
    <div class="tiles">
      <div class="tile card">
        <span class="label">Streak</span>
        <span class="value"
          >{{ dash.streakDays }}<small> day{{ dash.streakDays === 1 ? '' : 's' }}</small></span
        >
      </div>
      <div class="tile card">
        <span class="label">Average time to pass</span>
        <span class="value">{{
          dash.averageTimeMs === null ? '–' : formatDuration(dash.averageTimeMs)
        }}</span>
      </div>
      <div class="tile card">
        <span class="label">Attempts</span>
        <span class="value">{{ dash.totalAttempts }}</span>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <h3>Solved per language</h3>
        <ul class="bars">
          <li v-for="lang in LANGUAGES" :key="lang">
            <span class="bar-label">{{ LANGUAGE_LABELS[lang] }}</span>
            <span class="bar"
              ><span
                :style="{ width: `${(dash.solvedByLanguage[lang] / (totals[lang] || 1)) * 100}%` }"
              ></span
            ></span>
            <span class="bar-value">{{ dash.solvedByLanguage[lang] }}/{{ totals[lang] }}</span>
          </li>
        </ul>
      </div>

      <div class="card">
        <h3>Typing speed</h3>
        <template v-if="dash.wpmTrend.length > 0">
          <p class="big">{{ lastWpm }} <small>wpm last drill</small></p>
          <WpmSparkline v-if="dash.wpmTrend.length > 1" :points="dash.wpmTrend" />
        </template>
        <p v-else class="muted">Finish a typing drill to see your speed here.</p>
      </div>

      <div class="card">
        <h3>Weakest tags</h3>
        <ul v-if="dash.weakestTags.length" class="weak">
          <li v-for="t in dash.weakestTags" :key="t.tag">
            <span class="tag">{{ t.tag }}</span>
            <span class="muted"
              >{{ Math.round(t.passRate * 100) }}% of {{ t.attempts }} attempts passed</span
            >
          </li>
        </ul>
        <p v-else class="muted">No weak spots yet. Attempts that fail show up here.</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dashboard {
  display: grid;
  gap: 14px;
}
.tiles {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.tile {
  display: grid;
  gap: 4px;
}
.label {
  font-size: 12.5px;
  color: var(--text-muted);
}
.value {
  font-family: var(--font-mono);
  font-size: 28px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}
.value small,
.big small {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 400;
  color: var(--text-muted);
}
.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
h3 {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
}
.big {
  margin: 0 0 6px;
  font-family: var(--font-mono);
  font-size: 22px;
  font-weight: 700;
}
.bars,
.weak {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.bars li {
  display: grid;
  grid-template-columns: 84px 1fr auto;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}
.bar {
  height: 8px;
  border-radius: 999px;
  background: var(--surface-2);
  overflow: hidden;
}
.bar span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--accent);
}
.bar-value {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-muted);
}
.weak li {
  display: grid;
  gap: 4px;
  justify-items: start;
  font-size: 12.5px;
}
.muted {
  font-size: 13px;
}
@media (max-width: 900px) {
  .grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 520px) {
  .tiles {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
