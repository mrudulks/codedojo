<script setup lang="ts">
import { formatMs } from '../composables/format'
import type { RunResult } from '../runners/types'

defineProps<{
  result: RunResult | null
  running: boolean
  status: string | null
  /** Hide stdout (e.g. predict mode shows it in its own diff). */
  hideStdout?: boolean
}>()
</script>

<template>
  <section class="output" aria-live="polite" aria-label="Output">
    <header class="output-head">
      <h2>Output</h2>
      <span v-if="running" class="running">
        <span class="spinner" aria-hidden="true"></span>
        {{ status ?? 'Running…' }}
      </span>
      <span v-else-if="result" class="muted time">ran in {{ formatMs(result.timeMs) }}</span>
    </header>
    <p v-if="!result && !running" class="muted empty">
      Run your code with the button or Ctrl/⌘ + Enter.
    </p>
    <template v-if="result">
      <div v-if="result.error" class="error" :class="{ timeout: result.timedOut }">
        <pre>{{ result.error }}</pre>
        <span v-if="result.errorLine" class="line-ref">line {{ result.errorLine }}</span>
      </div>
      <ul v-if="result.diagnostics?.length" class="diagnostics">
        <li v-for="(d, i) in result.diagnostics" :key="i">
          <span class="line-ref">line {{ d.line }}:{{ d.column }}</span>
          <pre>{{ d.message }}</pre>
        </li>
      </ul>
      <pre v-if="result.stdout && !hideStdout" class="stream">{{ result.stdout }}</pre>
      <pre v-if="result.stderr" class="stream stderr">{{ result.stderr }}</pre>
      <p
        v-if="!result.stdout && !result.stderr && !result.error && !result.results && !hideStdout"
        class="muted empty"
      >
        Finished with no output.
      </p>
    </template>
  </section>
</template>

<style scoped>
.output {
  display: grid;
  gap: 8px;
}
.output-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
h2 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.time {
  font-size: 12px;
  font-family: var(--font-mono);
}
.running {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--accent);
}
.empty {
  margin: 0;
  font-size: 13px;
}
pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.5;
}
.stream {
  padding: 10px 12px;
  border-radius: var(--radius);
  background: var(--code-bg);
  border: 1px solid var(--border);
  max-height: 260px;
  overflow: auto;
}
.stderr {
  color: var(--warning);
}
.error {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--radius);
  background: var(--danger-soft);
  color: var(--danger);
}
.error.timeout {
  background: var(--warning-soft);
  color: var(--warning);
}
.line-ref {
  flex: none;
  font-family: var(--font-mono);
  font-size: 12px;
  opacity: 0.85;
}
.diagnostics {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.diagnostics li {
  display: grid;
  gap: 2px;
  padding: 8px 12px;
  border-left: 3px solid var(--danger);
  background: var(--surface-2);
  border-radius: 0 var(--radius) var(--radius) 0;
}
.diagnostics .line-ref {
  color: var(--danger);
}
</style>
