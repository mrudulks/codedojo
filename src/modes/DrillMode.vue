<script setup lang="ts">
import { toRef } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import BriefPanel from '../components/BriefPanel.vue'
import CodeEditor from '../components/CodeEditor.vue'
import EditorPane from '../components/EditorPane.vue'
import StatsBar from '../components/StatsBar.vue'
import TaskLayout from '../components/TaskLayout.vue'
import type { Language } from '../languages'
import { useProgressStore } from '../stores/progress'
import type { TaskOf } from '../tasks/schema'
import DrillResult from './DrillResult.vue'
import { useDrill } from './useDrill'

const props = defineProps<{ task: TaskOf<'drill'>; language: Language }>()

const drill = useDrill(toRef(props, 'task'), toRef(props, 'language'))
const {
  typed,
  target,
  docKey,
  extension,
  keystrokes,
  blocked,
  elapsedMs,
  live,
  progressRatio,
  finished,
} = drill
const progress = useProgressStore()
</script>

<template>
  <TaskLayout>
    <template #main>
      <EditorPane class="target-pane" title="Snippet">
        <template #actions>
          <div
            class="progress"
            role="progressbar"
            :aria-valuenow="Math.round(progressRatio * 100)"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Snippet progress"
          >
            <span :style="{ width: `${progressRatio * 100}%` }"></span>
          </div>
        </template>
        <CodeEditor
          :model-value="target"
          :doc-key="`${task.id}|${language}`"
          :language="language"
          label="Snippet to retype (read only)"
          read-only
        />
      </EditorPane>
      <EditorPane title="Retype it here" grow>
        <template #actions>
          <span class="live" aria-live="off">
            <strong>{{ live.wpm }}</strong> wpm ·
            <strong>{{ Math.round(live.accuracy * 100) }}%</strong> accuracy
          </span>
          <button type="button" class="btn btn-quiet" @click="drill.restart">
            <AppIcon name="reset" /> Restart
          </button>
        </template>
        <CodeEditor
          v-model="typed"
          :doc-key="docKey"
          :language="language"
          :extensions="extension"
          :read-only="finished !== null"
          label="Retype the snippet"
          @keystroke="keystrokes++"
          @blocked="blocked++"
        />
        <template #footer>
          <StatsBar
            :keystrokes="keystrokes"
            :characters="typed.length"
            :blocked="blocked"
            :elapsed-ms="elapsedMs"
          />
        </template>
      </EditorPane>
    </template>
    <template #aside>
      <BriefPanel
        :task="task"
        :language="language"
        :hints-shown="0"
        :solved="progress.isSolved(task.id, language)"
      >
        <p class="note">
          The timer starts with your first keystroke. Mistakes are underlined as you type; fix them
          to finish.
        </p>
      </BriefPanel>
      <DrillResult v-if="finished" :result="finished" @restart="drill.restart" />
    </template>
  </TaskLayout>
</template>

<style scoped>
.target-pane {
  flex: 0 0 45%;
  border-bottom: 1px solid var(--border);
}
.progress {
  width: 120px;
  height: 6px;
  border-radius: 999px;
  background: var(--surface-2);
  overflow: hidden;
}
.progress span {
  display: block;
  height: 100%;
  background: var(--accent);
  transition: width 120ms ease-out;
}
.live {
  font-size: 12.5px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
.live strong {
  color: var(--text);
  font-family: var(--font-mono);
}
@media (max-width: 1080px) {
  .target-pane :deep(.pane-body) {
    min-height: 280px;
  }
}
</style>
