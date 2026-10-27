<template>
  <div class="task-layout">
    <div class="main">
      <slot name="main" />
    </div>
    <aside class="aside">
      <slot name="aside" />
    </aside>
  </div>
</template>

<style scoped>
.task-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 400px);
  height: 100%;
  min-height: 0;
}
.main {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  border-right: 1px solid var(--border);
}
.aside {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  overflow-y: auto;
  min-height: 0;
  background: var(--surface);
}
@media (max-width: 1080px) {
  .task-layout {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto auto;
    height: auto;
  }
  .main {
    border-right: none;
    border-bottom: 1px solid var(--border);
    min-height: 60vh;
  }
  .aside {
    overflow: visible;
    padding: 16px;
  }
}
</style>
