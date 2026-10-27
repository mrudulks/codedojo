<script setup lang="ts">
import { computed } from 'vue'
import { formatValue } from '../composables/format'
import type { TestResult } from '../harness/types'
import AppIcon from './AppIcon.vue'

const props = defineProps<{ results: TestResult[] }>()

const passedCount = computed(() => props.results.filter((r) => r.passed).length)

function formatArgs(args: unknown[]): string {
  return args.map(formatValue).join(', ')
}
</script>

<template>
  <section class="tests" aria-label="Test results">
    <header>
      <h2>Tests</h2>
      <span class="count" :class="passedCount === results.length ? 'all' : 'some'">
        {{ passedCount }} of {{ results.length }} passed
      </span>
    </header>
    <ol>
      <li v-for="(r, i) in results" :key="i" :class="r.passed ? 'pass' : 'fail'">
        <span class="mark" :aria-label="r.passed ? 'Passed' : 'Failed'">
          <AppIcon :name="r.passed ? 'check' : 'cross'" :size="14" />
        </span>
        <div class="body">
          <code class="call">({{ formatArgs(r.args) }})</code>
          <template v-if="!r.passed">
            <div class="row">
              <span>expected</span><code>{{ formatValue(r.expected) }}</code>
            </div>
            <div v-if="!r.error" class="row">
              <span>got</span><code>{{ formatValue(r.got) }}</code>
            </div>
            <pre
              v-else
              class="err">{{ r.error }}<template v-if="r.errorLine"> (line {{ r.errorLine }})</template></pre>
          </template>
        </div>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.tests {
  display: grid;
  gap: 8px;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
h2 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.count {
  font-size: 12px;
  font-family: var(--font-mono);
}
.count.all {
  color: var(--success);
}
.count.some {
  color: var(--danger);
}
ol {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
li {
  display: flex;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius);
  background: var(--surface-2);
  border: 1px solid transparent;
}
li.fail {
  border-color: var(--danger-soft);
}
.mark {
  flex: none;
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
}
.pass .mark {
  background: var(--success-soft);
  color: var(--success);
}
.fail .mark {
  background: var(--danger-soft);
  color: var(--danger);
}
.body {
  display: grid;
  gap: 3px;
  min-width: 0;
  font-size: 13px;
}
code,
pre {
  font-family: var(--font-mono);
  font-size: 12.5px;
  word-break: break-word;
  white-space: pre-wrap;
}
.call {
  color: var(--text);
}
.row {
  display: flex;
  gap: 8px;
}
.row span {
  flex: none;
  width: 60px;
  color: var(--text-muted);
}
.err {
  margin: 0;
  color: var(--danger);
}
</style>
