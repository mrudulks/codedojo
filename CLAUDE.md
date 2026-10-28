# CLAUDE.md — Code Dojo (personal practice code editor)

## What this project is

A browser-based code editor for deliberate practice. The user types every character by hand: no paste, no autocomplete, no bracket auto-closing. It supports Python, TypeScript and JavaScript, and serves practice tasks (solve, fix, predict, drill, translate, refactor) with automatic test checking and progress tracking.

The full roadmap is in `PLAN.md`. Work one phase at a time and do not start a later phase unless asked.

## Stack

- Vite + Vue 3 (Composition API, `<script setup lang="ts">`) + TypeScript in strict mode
- Pinia for state
- CodeMirror 6 for the editor (`@codemirror/view`, `@codemirror/state`, language packages). Do NOT add `@codemirror/autocomplete` or `closeBrackets`; do not use `basicSetup`, compose extensions by hand.
- Code execution in Web Workers only (never `eval` on the main thread)
  - JS: plain worker
  - TS: `typescript` package (`transpileModule`), type checking via `@typescript/vfs` in phase 4
  - Python: Pyodide, loaded lazily inside its own worker
- Storage: IndexedDB via `idb-keyval` (or `idb`)
- Tests: Vitest for unit tests of harnesses, task validation and the scheduler

## Folder structure

```
src/
  editor/      CodeMirror setup, manual-typing guard, keystroke stats
  runners/     js.worker.ts, ts.worker.ts, py.worker.ts, runner.ts (shared interface)
  harness/     per-language test harness generators
  tasks/       task JSON files, loader, schema validator
  lessons/     study-note JSON files, loader, schema validator
  modes/       solve, fix, predict, drill, translate, refactor
  progress/    storage, stats, spaced-repetition scheduler
  components/  Vue UI components
  stores/      Pinia stores
```

## Core rules

1. Manual typing is the product. Any change that lets text enter the editor without keystrokes (paste, drop, snippets, completion, auto-close) is a bug.
2. Every runner implements the same interface:
   `run(req: { language, code, tests?, timeoutMs }) => Promise<RunResult>`
   where `RunResult = { stdout: string; stderr: string; error?: string; results?: TestResult[]; timeMs: number; timedOut: boolean }`.
   UI code never branches on language-specific runner details.
3. User code always runs in a worker with a timeout (default 3000 ms); on timeout the worker is terminated and recreated.
4. Tasks are data. Adding a task must never require code changes. Validate every task file against the schema at load time and in a Vitest test.
5. Keep components small; business logic goes in composables or plain TS modules, not in `.vue` files.

## Commands

- `npm run dev` — dev server
- `npm run build` — type-check and build
- `npm run test` — Vitest
- `npm run lint` — ESLint + Prettier check

Run `npm run build` and `npm run test` before calling a phase done.

## Style

- TypeScript strict, no `any` unless commented why.
- Named exports; one main concern per file.
- UI copy in plain sentence case.
- Support light and dark themes via CSS variables.

## Decisions

- Zod (v4) validates tasks; the schema is a discriminated union on `mode` in `src/tasks/schema.ts`.
- `RunRequest.tests` is `{ functionName, cases }` (the function name is needed to build the harness). `RunRequest.options.runWithTypeErrors` carries the TS setting. `RunResult` also has optional `diagnostics` (TS type errors) and `errorLine`; the UI renders them generically.
- JS runs in a fresh worker per run (clean globals); the code is executed with indirect `eval` plus `//# sourceURL=user.js` so stack lines map to editor lines. Syntax errors are located with `acorn`.
- TS: a persistent compiler worker type-checks (`@typescript/vfs`, lib `es2022` + a tiny `console` declaration, no DOM) and transpiles with a source map; the JS is then run by the JS executor and error lines are mapped back.
- Python: Pyodide v0.27.2 imported from the jsDelivr CDN inside a module worker. The timeout clock starts after Pyodide is ready. Python tests in Vitest run the generated harness with the local `python3` (keep task code 3.9-compatible).
- Task JSON files may carry a reference `solution` per language; Vitest runs every solution against its tests (and checks fix starters fail, refactor starters break a constraint).
- Strict mode on = bulk-insertion transaction filter + paste/drop blocking; strict mode off keeps paste/drop blocking but drops the bulk filter (for IMEs/mobile keyboards).
- Whitespace-only insertions (auto-indent, Tab) are allowed by the filter.
- Progress: every check is an attempt in IndexedDB. The scheduler groups attempts per task+language per day (pass if any pass that day, hints = max) — see `src/progress/scheduler.ts`.
- Study notes ("Learn") are data in `src/lessons/data/*.json` (schema in `src/lessons/schema.ts`). Each lesson lists the task tags it explains; tasks link to matching lessons, and Vitest checks every task tag has a lesson and runs every example to confirm it prints exactly its stated `output`. A TypeScript view falls back to the JavaScript example when there is no TS one.
