<script setup lang="ts">
import type { Language } from '../languages'
import type { TaskOf } from '../tasks/schema'
import TestedWorkspace from './TestedWorkspace.vue'

defineProps<{ task: TaskOf<'solve'>; language: Language }>()
</script>

<template>
  <TestedWorkspace :task="task" :language="language" solved-title="Solved: all tests pass" />
</template>
