<script setup lang="ts">
import AppIcon from './AppIcon.vue'

defineProps<{ running: boolean; label?: string }>()
const emit = defineEmits<{ run: [] }>()
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
</script>

<template>
  <button type="button" class="btn btn-primary" :disabled="running" @click="emit('run')">
    <AppIcon name="play" :size="14" />
    {{ running ? 'Running…' : (label ?? 'Run') }}
    <kbd>{{ isMac ? '⌘' : 'Ctrl' }} ↵</kbd>
  </button>
</template>
