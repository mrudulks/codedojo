<script setup lang="ts">
import { computed } from 'vue'
import { toProseBlocks } from '../lessons/blocks'
import RichText from './RichText.vue'

const props = defineProps<{ paragraphs: string[] }>()
const blocks = computed(() => toProseBlocks(props.paragraphs))
</script>

<template>
  <template v-for="(block, i) in blocks" :key="i">
    <p v-if="block.kind === 'paragraph'"><RichText :text="block.text" /></p>
    <ul v-else>
      <li v-for="(item, j) in block.items" :key="j"><RichText :text="item" /></li>
    </ul>
  </template>
</template>
