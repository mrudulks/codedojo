<script setup lang="ts">
import { ref } from 'vue'
import { useProgressStore } from '../stores/progress'
import { useToastStore } from '../stores/toasts'
import AppIcon from './AppIcon.vue'

const progress = useProgressStore()
const toasts = useToastStore()
const fileInput = ref<HTMLInputElement>()

function exportProgress() {
  const blob = new Blob([progress.exportJson()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `code-dojo-progress-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

async function importProgress(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  try {
    const added = await progress.importJson(await file.text())
    toasts.show(`Imported ${added} attempt${added === 1 ? '' : 's'}.`, 'success')
  } catch (err) {
    toasts.show(err instanceof Error ? err.message : String(err), 'warning', 4000)
  }
}
</script>

<template>
  <section class="backup card" aria-labelledby="backup-title">
    <div>
      <h2 id="backup-title">Backup</h2>
      <p class="muted">
        Progress lives in this browser. Export it now and then, or move it to another device.
      </p>
      <p v-if="progress.storageError" class="error" role="alert">{{ progress.storageError }}</p>
    </div>
    <div class="actions">
      <button type="button" class="btn" @click="exportProgress">
        <AppIcon name="download" /> Export JSON
      </button>
      <button type="button" class="btn" @click="fileInput?.click()">
        <AppIcon name="upload" /> Import JSON
      </button>
      <input
        ref="fileInput"
        type="file"
        accept="application/json,.json"
        hidden
        @change="importProgress"
      />
    </div>
  </section>
</template>

<style scoped>
.backup {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
h2 {
  margin: 0;
  font-size: 14px;
}
p {
  margin: 4px 0 0;
  font-size: 13px;
}
.error {
  color: var(--danger);
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
