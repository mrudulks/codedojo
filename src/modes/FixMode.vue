<script setup lang="ts">
import type { Language } from '../languages'
import type { TaskOf } from '../tasks/schema'
import TestedWorkspace from './TestedWorkspace.vue'

defineProps<{ task: TaskOf<'fix'>; language: Language }>()
</script>

<template>
  <TestedWorkspace
    :task="task"
    :language="language"
    editor-title="Buggy code"
    reset-label="Restore buggy code"
    solved-title="Bug fixed: all tests pass"
  >
    <template #brief>
      <p class="note">Run it first to see which tests fail, then fix the code by hand.</p>
    </template>
  </TestedWorkspace>
</template>
