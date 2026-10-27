<script setup lang="ts">
import { computed } from 'vue'
import { splitInlineCode } from '../composables/format'

const props = defineProps<{ text: string }>()
const parts = computed(() => splitInlineCode(props.text))
</script>

<template>
  <span>
    <template v-for="(part, i) in parts" :key="i">
      <code v-if="part.code" class="inline-code">{{ part.text }}</code>
      <template v-else>{{ part.text }}</template>
    </template>
  </span>
</template>
