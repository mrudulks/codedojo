<script setup lang="ts">
import { LANGUAGES, LANGUAGE_LABELS, LANGUAGE_SHORT, type Language } from '../languages'

defineProps<{ available?: readonly Language[] }>()
const model = defineModel<Language>({ required: true })
</script>

<template>
  <div class="segmented" role="radiogroup" aria-label="Language">
    <button
      v-for="lang in LANGUAGES"
      :key="lang"
      type="button"
      role="radio"
      :aria-checked="model === lang"
      :class="{ active: model === lang, unavailable: available && !available.includes(lang) }"
      :title="LANGUAGE_LABELS[lang]"
      @click="model = lang"
    >
      <span class="short">{{ LANGUAGE_SHORT[lang] }}</span>
      <span class="long">{{ LANGUAGE_LABELS[lang] }}</span>
    </button>
  </div>
</template>

<style scoped>
.segmented {
  display: inline-flex;
  padding: 3px;
  gap: 2px;
  border-radius: 10px;
  background: var(--surface-2);
  border: 1px solid var(--border);
}
button {
  padding: 5px 12px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--text-muted);
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}
button:hover {
  color: var(--text);
}
button.active {
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow-sm);
}
button.unavailable:not(.active) {
  opacity: 0.45;
}
.short {
  display: none;
}
@media (max-width: 720px) {
  .short {
    display: inline;
  }
  .long {
    display: none;
  }
}
</style>
