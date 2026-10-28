<script setup lang="ts">
import { computed } from 'vue'
import { highlightLines } from '../editor/highlight'
import type { Language } from '../languages'

const props = defineProps<{ code: string; language: Language; output?: string }>()
const lines = computed(() => highlightLines(props.code, props.language))
</script>

<template>
  <figure class="code-block">
    <pre
      class="source"
    ><code><span v-for="(line, i) in lines" :key="i" class="line"><span v-for="(tok, j) in line" :key="j" :class="tok.classes">{{ tok.text }}</span></span></code></pre>
    <figcaption v-if="output !== undefined" class="output">
      <span class="label">Prints</span>
      <pre>{{ output || '(nothing)' }}</pre>
    </figcaption>
  </figure>
</template>

<style scoped>
.code-block {
  margin: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--code-bg);
}
pre {
  margin: 0;
  padding: 12px 14px;
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: 13.5px;
  line-height: 1.6;
  font-variant-ligatures: none;
  color: var(--code-text);
  tab-size: 4;
}
.line {
  display: block;
  min-height: 1.6em;
}
.output {
  display: grid;
  border-top: 1px dashed var(--border);
  background: var(--surface-2);
}
.output .label {
  padding: 8px 14px 0;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.output pre {
  padding-top: 4px;
}
.tok-keyword {
  color: var(--code-keyword);
}
.tok-string,
.tok-string2 {
  color: var(--code-string);
}
.tok-number,
.tok-bool,
.tok-atom {
  color: var(--code-number);
}
.tok-comment {
  color: var(--code-comment);
  font-style: italic;
}
.tok-typeName,
.tok-className,
.tok-namespace {
  color: var(--code-type);
}
.tok-propertyName {
  color: var(--code-property);
}
.tok-definition {
  color: var(--code-function);
}
.tok-operator,
.tok-punctuation {
  color: var(--code-punctuation);
}
</style>
