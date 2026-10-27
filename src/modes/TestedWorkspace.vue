<script setup lang="ts">
import { computed, toRef } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import BriefPanel from '../components/BriefPanel.vue'
import CodeEditor from '../components/CodeEditor.vue'
import EditorPane from '../components/EditorPane.vue'
import OutputPanel from '../components/OutputPanel.vue'
import RunButton from '../components/RunButton.vue'
import SolvedBanner from '../components/SolvedBanner.vue'
import StatsBar from '../components/StatsBar.vue'
import TaskLayout from '../components/TaskLayout.vue'
import TestResults from '../components/TestResults.vue'
import type { Language } from '../languages'
import { useProgressStore } from '../stores/progress'
import type { TestedTask } from '../tasks/schema'
import { useTestedTask } from './useTestedTask'

const props = withDefaults(
  defineProps<{
    task: TestedTask
    language: Language
    editorTitle?: string
    resetLabel?: string
    solvedTitle?: string
    /** Extra pass condition on top of the tests (refactor constraints). */
    extraCheck?: (code: string) => boolean
  }>(),
  {
    editorTitle: 'Your code',
    resetLabel: 'Reset',
    solvedTitle: 'All tests pass',
    extraCheck: () => true,
  },
)

const session = useTestedTask(toRef(props, 'task'), toRef(props, 'language'), (code) =>
  props.extraCheck(code),
)
const { code, result, passed, hintsShown, docKey, stats, running, status } = session
const progress = useProgressStore()

const errorLine = computed(
  () => result.value?.errorLine ?? result.value?.diagnostics?.[0]?.line ?? null,
)
</script>

<template>
  <TaskLayout>
    <template #main>
      <slot name="before-editor" />
      <EditorPane :title="editorTitle" grow>
        <template #actions>
          <button type="button" class="btn btn-quiet" @click="session.reset">
            <AppIcon name="reset" /> {{ resetLabel }}
          </button>
          <RunButton :running="running" @run="session.run" />
        </template>
        <CodeEditor
          v-model="code"
          :doc-key="docKey"
          :language="language"
          :error-line="errorLine"
          label="Code editor"
          @run="session.run"
          @keystroke="stats.keystroke"
          @blocked="stats.block"
        />
        <template #footer>
          <StatsBar
            :keystrokes="stats.keystrokes.value"
            :characters="code.length"
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
      >
        <slot name="brief" />
      </BriefPanel>
      <SolvedBanner
        v-if="passed"
        :title="solvedTitle"
        :elapsed-ms="stats.elapsedMs.value"
        :keystrokes="stats.keystrokes.value"
        :hints-used="hintsShown"
      />
      <slot name="results" :code="code" />
      <TestResults v-if="result?.results" :results="result.results" />
      <OutputPanel :result="result" :running="running" :status="status" />
    </template>
  </TaskLayout>
</template>
