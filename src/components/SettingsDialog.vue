<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '../stores/settings'
import AppIcon from './AppIcon.vue'

const { settings } = useSettingsStore()
const dialog = ref<HTMLDialogElement>()

defineExpose({ open: () => dialog.value?.showModal() })
</script>

<template>
  <dialog
    ref="dialog"
    class="settings"
    aria-labelledby="settings-title"
    @click.self="dialog?.close()"
  >
    <form method="dialog">
      <header>
        <h2 id="settings-title">Settings</h2>
        <button class="icon-btn" aria-label="Close settings"><AppIcon name="cross" /></button>
      </header>

      <fieldset>
        <legend>Typing</legend>
        <label class="toggle">
          <input v-model="settings.strict" type="checkbox" />
          <span>
            <strong>Strict mode</strong>
            <small
              >Reject any insertion longer than 4 characters that was not typed (autofill,
              autocorrect, text expanders). Paste and drop stay blocked either way.</small
            >
          </span>
        </label>
        <label class="toggle">
          <input v-model="settings.autoIndent" type="checkbox" />
          <span>
            <strong>Auto-indent on Enter</strong>
            <small
              >Keep the current indentation on a new line. Off means you type every space.</small
            >
          </span>
        </label>
        <div class="field">
          <span
            ><strong>Tab size</strong
            ><small>Auto uses 4 for Python and 2 for JavaScript and TypeScript.</small></span
          >
          <div class="segmented">
            <label v-for="opt in ['auto', 2, 4] as const" :key="opt">
              <input v-model="settings.tabSize" type="radio" name="tab-size" :value="opt" />
              <span>{{ opt === 'auto' ? 'Auto' : opt }}</span>
            </label>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Running</legend>
        <label class="toggle">
          <input v-model="settings.runWithTypeErrors" type="checkbox" />
          <span>
            <strong>Run even with type errors</strong>
            <small>TypeScript only. Type errors are still listed.</small>
          </span>
        </label>
      </fieldset>

      <fieldset>
        <legend>Appearance</legend>
        <div class="field">
          <span><strong>Theme</strong></span>
          <div class="segmented">
            <label v-for="opt in ['system', 'light', 'dark'] as const" :key="opt">
              <input v-model="settings.theme" type="radio" name="theme" :value="opt" />
              <span>{{ opt[0]!.toUpperCase() + opt.slice(1) }}</span>
            </label>
          </div>
        </div>
      </fieldset>
    </form>
  </dialog>
</template>

<style scoped>
.settings {
  width: min(520px, calc(100vw - 32px));
  max-height: calc(100dvh - 32px);
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow-lg);
}
.settings::backdrop {
  background: rgb(0 0 0 / 0.35);
}
form {
  display: grid;
  gap: 18px;
  padding: 20px;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
h2 {
  margin: 0;
  font-size: 18px;
}
fieldset {
  display: grid;
  gap: 14px;
  margin: 0;
  padding: 0;
  border: 0;
}
legend {
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.toggle,
.field {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.field {
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}
.toggle input {
  margin-top: 3px;
  accent-color: var(--accent);
  width: 16px;
  height: 16px;
}
strong {
  display: block;
  font-weight: 500;
}
small {
  display: block;
  margin-top: 2px;
  color: var(--text-muted);
  line-height: 1.45;
}
.segmented {
  display: inline-flex;
  padding: 3px;
  gap: 2px;
  border-radius: 9px;
  background: var(--surface-2);
  border: 1px solid var(--border);
}
.segmented input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.segmented span {
  display: block;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  color: var(--text-muted);
}
.segmented input:checked + span {
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow-sm);
}
.segmented input:focus-visible + span {
  outline: 2px solid var(--accent);
}
</style>
