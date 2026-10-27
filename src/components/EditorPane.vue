<script setup lang="ts">
defineProps<{ title?: string; grow?: boolean }>()
</script>

<template>
  <section class="pane" :class="{ grow }">
    <header v-if="title || $slots.actions" class="pane-head">
      <h2 v-if="title">{{ title }}</h2>
      <div class="actions"><slot name="actions" /></div>
    </header>
    <div class="pane-body"><slot /></div>
    <slot name="footer" />
  </section>
</template>

<style scoped>
.pane {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.pane.grow {
  flex: 1;
}
.pane-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  padding: 8px 12px 8px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
  min-height: 48px;
}
h2 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
}
.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
.pane-body {
  flex: 1;
  min-height: 0;
  position: relative;
}
.pane-body > :deep(*) {
  position: absolute;
  inset: 0;
}
@media (max-width: 1080px) {
  .pane.grow .pane-body {
    min-height: 50vh;
  }
}
</style>
