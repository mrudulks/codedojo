import { defineStore } from 'pinia'
import { computed, reactive, watch } from 'vue'
import { DEFAULT_INDENT, isLanguage, type Language } from '../languages'
import { readJson, writeJson } from './persist'

export type ThemeChoice = 'system' | 'light' | 'dark'
export type TabSizeChoice = 'auto' | 2 | 4

export interface Settings {
  theme: ThemeChoice
  strict: boolean
  autoIndent: boolean
  tabSize: TabSizeChoice
  runWithTypeErrors: boolean
  language: Language
}

const KEY = 'codedojo:settings'

const DEFAULTS: Settings = {
  theme: 'system',
  strict: true,
  autoIndent: false,
  tabSize: 'auto',
  runWithTypeErrors: false,
  language: 'javascript',
}

export const useSettingsStore = defineStore('settings', () => {
  const stored = readJson(KEY, DEFAULTS)
  const settings = reactive<Settings>({
    ...stored,
    language: isLanguage(stored.language) ? stored.language : 'javascript',
  })

  watch(settings, (value) => writeJson(KEY, value), { deep: true })

  function tabSizeFor(language: Language | 'plain'): number {
    if (settings.tabSize !== 'auto') return settings.tabSize
    return language === 'plain' ? 2 : DEFAULT_INDENT[language]
  }

  const resolvedTheme = computed<'light' | 'dark'>(() => {
    if (settings.theme !== 'system') return settings.theme
    return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  })

  return { settings, tabSizeFor, resolvedTheme }
})
