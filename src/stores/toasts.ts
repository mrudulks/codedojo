import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Toast {
  id: number
  message: string
  tone: 'info' | 'warning' | 'success'
}

export const useToastStore = defineStore('toasts', () => {
  const toasts = ref<Toast[]>([])
  let nextId = 1
  let lastMessage = ''
  let lastAt = 0

  function show(message: string, tone: Toast['tone'] = 'info', durationMs = 2400) {
    // Collapse bursts of the same message (e.g. repeated paste attempts).
    const now = Date.now()
    if (message === lastMessage && now - lastAt < 600) return
    lastMessage = message
    lastAt = now
    const id = nextId++
    toasts.value = [...toasts.value.slice(-2), { id, message, tone }]
    setTimeout(() => dismiss(id), durationMs)
  }

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return { toasts, show, dismiss }
})
