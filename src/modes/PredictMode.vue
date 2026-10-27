<script setup lang="ts">
import { toRef } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import BriefPanel from '../components/BriefPanel.vue'
import CodeEditor from '../components/CodeEditor.vue'
import EditorPane from '../components/EditorPane.vue'
import OutputPanel from '../components/OutputPanel.vue'
import RunButton from '../components/RunButton.vue'
import StatsBar from '../components/StatsBar.vue'
import TaskLayout from '../components/TaskLayout.vue'
import type { Language } from '../languages'
import { useProgressStore } from '../stores/progress'
import type { TaskOf } from '../tasks/schema'
import PredictResult from './PredictResult.vue'
import { usePredictTask } from './usePredictTask'

const props = defineProps<{ task: TaskOf<'predict'>; language: Language }>()

const session = usePredictTask(toRef(props, 'task'), toRef(props, 'language'))
const { code, prediction, result, comparison, hintsShown, docKey, stats, running, status } = session
const progress = useProgressStore()
</script>

<template>
  <TaskLayout>
    <template #main>
      <EditorPane class="code-pane" title="Read this code">
        <CodeEditor
          :model-value="code"
          :doc-key="`${task.id}|${language}`"
          :language="language"
          label="Program to read (read only)"
          read-only
        />
      </EditorPane>
      <EditorPane title="Your prediction of the output" grow>
        <template #actions>
          <button type="button" class="btn btn-quiet" @click="session.clear">
            <AppIcon name="reset" /> Clear
          </button>
          <RunButton :running="running" label="Check" @run="session.check" />
        </template>
        <CodeEditor
          v-model="prediction"
          :doc-key="docKey"
          language="plain"
          label="Predicted output"
          @run="session.check"
          @keystroke="stats.keystroke"
          @blocked="stats.block"
        />
        <template #footer>
          <StatsBar
            :keystrokes="stats.keystrokes.value"
            :characters="prediction.length"
            :blocked="stats.blocked.value"
            :elapsed-ms="stats.elapsedMs.value"
          />
        </template>
      </EditorPane>
    </template>
    <template #aside>
      <BriefPanel
        :task="task"
        :language="language"
        :hints-shown="hintsShown"
        :solved="progress.isSolved(task.id, language)"
        @reveal-hint="session.revealHint"
      />
      <PredictResult v-if="comparison" :comparison="comparison" />
      <OutputPanel :result="result" :running="running" :status="status" hide-stdout />
    </template>
  </TaskLayout>
</template>

<style scoped>
.code-pane {
  flex: 0 0 52%;
  border-bottom: 1px solid var(--border);
}
@media (max-width: 1080px) {
  .code-pane :deep(.pane-body) {
    min-height: 300px;
  }
}
</style>
