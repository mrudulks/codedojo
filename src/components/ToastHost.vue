<script setup lang="ts">
import { useToastStore } from '../stores/toasts'

const toasts = useToastStore()
</script>

<template>
  <div class="toast-host" role="status" aria-live="polite">
    <TransitionGroup name="toast">
      <div
        v-for="t in toasts.toasts"
        :key="t.id"
        class="toast"
        :class="t.tone"
        @click="toasts.dismiss(t.id)"
      >
        {{ t.message }}
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-host {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 50;
  display: grid;
  gap: 8px;
  justify-items: end;
  pointer-events: none;
}
.toast {
  max-width: min(360px, calc(100vw - 32px));
  padding: 10px 14px;
  border-radius: 10px;
  background: var(--ink);
  color: var(--ink-text);
  font-size: 13.5px;
  box-shadow: var(--shadow-lg);
  pointer-events: auto;
  cursor: pointer;
  border-left: 3px solid var(--accent);
}
.toast.warning {
  border-left-color: var(--warning);
}
.toast.success {
  border-left-color: var(--success);
}
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
