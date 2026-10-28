<script setup lang="ts">
import { computed } from 'vue'
import { splitRichText } from '../composables/format'

const props = defineProps<{ text: string }>()
const parts = computed(() => splitRichText(props.text))
</script>

<template>
  <span>
    <template v-for="(part, i) in parts" :key="i">
      <code v-if="part.kind === 'code'" class="inline-code">{{ part.text }}</code>
      <strong v-else-if="part.kind === 'bold'">{{ part.text }}</strong>
      <template v-else>{{ part.text }}</template>
    </template>
  </span>
</template>
