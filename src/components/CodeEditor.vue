<script setup lang="ts">
import type { Extension } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { errorLineHighlight } from '../editor/errorLine'
import type { BlockedKind } from '../editor/guard'
import type { EditorLanguage } from '../editor/languages'
import { createEditor, type EditorController, type EditorSettings } from '../editor/setup'
import { useSettingsStore } from '../stores/settings'
import { useToastStore } from '../stores/toasts'

const props = withDefaults(
  defineProps<{
    modelValue: string
    /** Changing the key replaces the document with modelValue (new task, reset). */
    docKey: string
    language: EditorLanguage
    label: string
    readOnly?: boolean
    lineNumbers?: boolean
    extensions?: Extension
    errorLine?: number | null
  }>(),
  { readOnly: false, lineNumbers: true, extensions: () => [], errorLine: null },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  run: []
  keystroke: []
  blocked: [kind: BlockedKind]
}>()

const BLOCKED_MESSAGES: Record<BlockedKind, string> = {
  paste: 'Paste is blocked here. Type it out.',
  drop: 'Dropping text is blocked here.',
  bulk: 'Blocked text that was not typed key by key.',
}

const host = ref<HTMLDivElement>()
const { settings, tabSizeFor } = useSettingsStore()
const toasts = useToastStore()
let editor: EditorController | undefined

function currentSettings(): EditorSettings {
  return {
    language: props.language,
    strict: settings.strict,
    autoIndent: settings.autoIndent,
    tabSize: tabSizeFor(props.language),
    readOnly: props.readOnly,
    lineNumbers: props.lineNumbers,
  }
}

function extraExtensions(): Extension {
  return [
    props.extensions,
    errorLineHighlight(props.errorLine),
    EditorView.contentAttributes.of({ 'aria-label': props.label }),
  ]
}

onMounted(() => {
  editor = createEditor(host.value!, props.modelValue, currentSettings(), {
    onChange: (doc) => emit('update:modelValue', doc),
    onKeystroke: () => emit('keystroke'),
    onRun: () => emit('run'),
    onBlocked: (kind) => {
      toasts.show(BLOCKED_MESSAGES[kind], 'warning')
      emit('blocked', kind)
    },
  })
  editor.setExtra(extraExtensions())
})

onBeforeUnmount(() => editor?.destroy())

watch(
  () => props.docKey,
  () => {
    editor?.setDoc(props.modelValue)
    editor?.setExtra(extraExtensions())
  },
)

watch(
  () => [
    props.language,
    props.readOnly,
    props.lineNumbers,
    settings.strict,
    settings.autoIndent,
    settings.tabSize,
  ],
  () => editor?.configure(currentSettings()),
)

watch(
  () => [props.extensions, props.errorLine],
  () => editor?.setExtra(extraExtensions()),
)

defineExpose({ focus: () => editor?.focus() })
</script>

<template>
  <div ref="host" class="code-editor" :class="{ 'is-readonly': readOnly }"></div>
</template>

<style scoped>
.code-editor {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--code-bg);
}
.code-editor :deep(.cm-editor) {
  height: 100%;
}
.is-readonly :deep(.cm-activeLine) {
  background: transparent;
}
</style>
