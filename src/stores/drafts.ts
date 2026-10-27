import { defineStore } from 'pinia'
import { readRaw, writeJson } from './persist'

const KEY = 'codedojo:drafts'

/** What the user has typed per task, language and editor, kept across reloads. */
export const useDraftsStore = defineStore('drafts', () => {
  const drafts: Record<string, string> = readRaw<Record<string, string>>(KEY, {})
  let timer: ReturnType<typeof setTimeout> | undefined

  function get(key: string): string | undefined {
    return drafts[key]
  }

  function set(key: string, value: string) {
    drafts[key] = value
    clearTimeout(timer)
    timer = setTimeout(() => writeJson(KEY, drafts), 400)
  }

  function remove(key: string) {
    delete drafts[key]
    writeJson(KEY, drafts)
  }

  return { get, set, remove }
})
