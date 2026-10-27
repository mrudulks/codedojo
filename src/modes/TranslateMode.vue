<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import CodeEditor from '../components/CodeEditor.vue'
import EditorPane from '../components/EditorPane.vue'
import { LANGUAGE_LABELS, type Language } from '../languages'
import type { TaskOf } from '../tasks/schema'
import TestedWorkspace from './TestedWorkspace.vue'

const props = defineProps<{ task: TaskOf<'translate'>; language: Language }>()

const sourceOptions = computed(() => props.task.languages.filter((l) => l !== props.language))
const sourceLanguage = ref<Language>(sourceOptions.value[0]!)

watch(sourceOptions, (options) => {
  if (!options.includes(sourceLanguage.value)) sourceLanguage.value = options[0]!
})

const sourceCode = computed(() => props.task.source[sourceLanguage.value] ?? '')
</script>

<template>
  <TestedWorkspace
    :task="task"
    :language="language"
    :editor-title="`Your ${LANGUAGE_LABELS[language]} version`"
    solved-title="Translated: all tests pass"
  >
    <template #before-editor>
      <EditorPane class="source-pane" :title="`Original`">
        <template #actions>
          <label class="inline-field">
            <span class="muted">from</span>
            <select v-model="sourceLanguage" class="select">
              <option v-for="l in sourceOptions" :key="l" :value="l">
                {{ LANGUAGE_LABELS[l] }}
              </option>
            </select>
          </label>
        </template>
        <CodeEditor
          :model-value="sourceCode"
          :doc-key="`${task.id}|${sourceLanguage}`"
          :language="sourceLanguage"
          label="Original code (read only)"
          read-only
        />
      </EditorPane>
    </template>
  </TestedWorkspace>
</template>

<style scoped>
.source-pane {
  flex: 0 0 38%;
  border-bottom: 1px solid var(--border);
}
@media (max-width: 1080px) {
  .source-pane :deep(.pane-body) {
    min-height: 240px;
  }
}
</style>
