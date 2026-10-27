<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import type { OutputComparison } from './predict'

const props = defineProps<{ comparison: OutputComparison }>()
const correct = computed(() => props.comparison.lines.filter((l) => l.matches).length)
</script>

<template>
  <section class="predict-result" aria-label="Prediction result">
    <div class="verdict" :class="comparison.passed ? 'ok' : 'bad'" role="status">
      <AppIcon :name="comparison.passed ? 'check' : 'cross'" :size="18" />
      <strong>{{ comparison.passed ? 'Exactly right' : 'Not quite' }}</strong>
      <span class="muted">{{ correct }} of {{ comparison.lines.length }} lines match</span>
    </div>
    <table>
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Actual output</th>
          <th scope="col">You predicted</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(line, i) in comparison.lines" :key="i" :class="line.matches ? 'match' : 'diff'">
          <td class="num">{{ i + 1 }}</td>
          <td>
            <code v-if="line.expected !== undefined">{{ line.expected }}</code
            ><em v-else>(no line)</em>
          </td>
          <td>
            <code v-if="line.predicted !== undefined">{{ line.predicted }}</code
            ><em v-else>(missing)</em>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.predict-result {
  display: grid;
  gap: 10px;
}
.verdict {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--radius);
}
.verdict .muted {
  margin-left: auto;
  font-size: 12px;
}
.ok {
  background: var(--success-soft);
  color: var(--success);
}
.bad {
  background: var(--danger-soft);
  color: var(--danger);
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
  table-layout: fixed;
}
th {
  text-align: left;
  font-weight: 500;
  color: var(--text-muted);
  padding: 4px 6px;
  border-bottom: 1px solid var(--border);
}
th:first-child {
  width: 28px;
}
td {
  padding: 4px 6px;
  vertical-align: top;
  border-bottom: 1px solid var(--border);
  word-break: break-word;
}
code {
  font-family: var(--font-mono);
  white-space: pre-wrap;
}
em {
  color: var(--text-muted);
}
.num {
  color: var(--text-muted);
  font-family: var(--font-mono);
}
tr.diff td:nth-child(3) {
  background: var(--danger-soft);
  color: var(--danger);
}
tr.diff td:nth-child(2) {
  background: var(--success-soft);
}
</style>
