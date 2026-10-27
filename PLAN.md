# PLAN.md — Code Dojo build plan

Each phase ends with something usable. Finish one phase, test it yourself, commit, then start the next.
Each phase has a suggested prompt for Claude Code; start the session with plan mode (Shift+Tab) so you can review the approach before code is written.

---

## Phase 0 — Project setup

**Goal:** empty app that builds, lints and tests.

- Vite + Vue 3 + TS strict, Pinia, Vitest, ESLint, Prettier
- Folder structure from `CLAUDE.md`
- Basic three-pane layout: task sidebar (left), editor (center), brief + output panel (right, stacks below on mobile)
- Light/dark theme with CSS variables

**Done when:** `npm run dev`, `npm run build`, `npm run test`, `npm run lint` all pass and the empty layout renders.

> Prompt: "Read CLAUDE.md and PLAN.md. Do Phase 0 only."

---

## Phase 1 — Editor + JavaScript runner

**Goal:** type JS and run it safely.

- CodeMirror 6 composed by hand: line numbers, syntax highlighting, active line, history (undo/redo), indent with Tab. No autocomplete, no closeBrackets.
- Language switcher (JS / TS / Python) controls highlighting even before runners exist.
- `runners/runner.ts` with the shared `run()` interface.
- `js.worker.ts`: overrides `console.log/error/warn`, captures output, posts it back. Errors include line numbers.
- Timeout: terminate and recreate the worker after 3 s; show "Stopped: took longer than 3 seconds".
- Output panel shows stdout, errors and run time. Run with button and Ctrl/Cmd+Enter.

**Done when:** `while(true){}` gets stopped without freezing the page, and `console.log([1,2])` prints correctly.

> Prompt: "Do Phase 1 from PLAN.md. Write Vitest tests for the runner interface where possible."

---

## Phase 2 — Manual-typing guard

**Goal:** the editor only accepts real typing.

- Block `paste`, `drop` and `beforeinput` of type `insertFromPaste` / `insertFromDrop`.
- CodeMirror transaction filter: reject any user insertion longer than 4 characters that isn't from a keystroke (allow IME composition).
- `spellcheck`, `autocorrect`, `autocapitalize` off on the content element.
- Settings: strict mode (default on), auto-indent on Enter (default off), tab size 2/4.
- Live stats bar: keystrokes typed, characters in editor, paste attempts blocked, time on task.
- Small non-blocking toast when a paste is blocked.

**Done when:** pasting, dragging text in and browser autofill all fail; normal typing, undo/redo and Tab work.

> Prompt: "Do Phase 2. Explain how the transaction filter distinguishes typing from bulk insertion."

---

## Phase 3 — Task engine (JavaScript first)

**Goal:** pick a task, write a solution, see which tests pass.

Task schema (`src/tasks/schema.ts`), validated with Zod:

```json
{
  "id": "two-sum",
  "mode": "solve",
  "languages": ["javascript", "typescript", "python"],
  "difficulty": 2,
  "tags": ["arrays", "hashmap"],
  "title": "Two sum",
  "prompt": "Return the indices of the two numbers that add up to target.",
  "functionName": { "python": "two_sum", "javascript": "twoSum", "typescript": "twoSum" },
  "starter": {
    "python": "def two_sum(nums, target):\n    ",
    "javascript": "function twoSum(nums, target) {\n  \n}",
    "typescript": "function twoSum(nums: number[], target: number): number[] {\n  \n}"
  },
  "tests": [
    { "args": [[2, 7, 11, 15], 9], "expected": [0, 1] },
    { "args": [[3, 3], 6], "expected": [0, 1] }
  ],
  "hints": ["What if you remembered every number you have already seen?"]
}
```

- Starter code is inserted programmatically (allowed); the guard only applies to user input.
- `harness/js.ts`: appends code that calls the function per test case, deep-compares via JSON, catches per-test errors, reports `{ passed, args, expected, got, error }`.
- Sidebar: tasks grouped by mode, filter by language, difficulty and tag, solved checkmark.
- Results panel: pass/fail per test with expected vs got.
- Hints revealed one at a time (counted for progress later).
- Write 10 solve tasks (difficulty 1–3) covering strings, arrays, objects/dicts, recursion, sorting.

**Done when:** all 10 tasks are solvable in JS and a Vitest test validates every task file.

> Prompt: "Do Phase 3 for JavaScript only. Keep harness generation pure functions with unit tests."

---

## Phase 4 — TypeScript and Python

**Goal:** every solve task works in all three languages.

- `ts.worker.ts`: `transpileModule` then run as JS. Add type checking with `@typescript/vfs` + lib files (`lib.es2022`, `lib.dom` optional); show type errors with line numbers before running. Setting: "Run even with type errors" (default off).
- `py.worker.ts`: lazy-load Pyodide on first Python run with a loading indicator; redirect `sys.stdout/stderr`; same timeout behavior.
- `harness/py.ts`: run user code via `exec` in a fresh namespace, call the function per test, compare with `json.loads(json.dumps(got)) == expected`, print a traceback for errors.
- Python uses 4-space indent by default, JS/TS use 2.

**Done when:** the 10 tasks pass in all three languages with correct solutions, fail with wrong ones, and a TS type error is reported clearly.

> Prompt: "Do Phase 4. Start with the TS runner, then Python. Show me how Pyodide is loaded before writing the worker."

---

## Phase 5 — Practice modes

**Goal:** more ways to practice than solving.

Build in this order (each mode is a component in `src/modes/` plus fields in the schema):

1. **Fix the bug:** starter has a subtle bug and failing tests. Make them pass.
2. **Predict the output:** read-only code; user types the expected stdout in a second small editor (also guarded); then the code runs and output is diffed.
3. **Typing drill:** retype a given snippet exactly. Show WPM, accuracy and highlight mistakes live. No running.
4. **Translate:** a solution in one language is shown read-only; rewrite it in another and pass the same tests.
5. **Refactor:** working but messy code; tests must still pass, plus a max line count or banned patterns (e.g. no `var`, no nested loops).

Write 3 tasks per mode per language to start. Good predict topics: JS closures in loops, `this`, hoisting, `==` vs `===`, async ordering; Python mutable default args, late-binding closures, integer division, slicing.

**Done when:** each mode has working tasks and its own result screen.

> Prompt: "Do Phase 5, mode 1 only (Fix the bug). Then wait." (Repeat for each mode.)

---

## Phase 6 — Progress and spaced repetition

**Goal:** the app knows what to give you next.

- Store per attempt: task id, language, mode, passed, time, keystrokes, hints used, date (IndexedDB).
- Dashboard: solved count per language, streak, average time, typing WPM trend, weakest tags (lowest pass rate).
- Scheduler: solved with no hints → review in 7 days; with hints → 2 days; failed → next day. Each clean re-solve doubles the interval.
- "Today" queue on the home screen: due reviews first, then one new task from a weak tag.
- Export/import progress as JSON (backup).

**Done when:** solving a task with a hint makes it reappear in the queue two days later (test with a mocked clock in Vitest).

---

## Phase 7 — Extras (pick any)

- In-app task editor with schema validation and live test preview
- Timed challenge mode and personal bests
- Keyboard-only navigation for the whole app
- PWA so it works offline (cache Pyodide and the TS lib files)
- Optional AI hints / code review via an API key you provide
- Sync progress through your own small Node + MongoDB backend

---

## Working with Claude Code — tips

- Keep `CLAUDE.md` updated when you make a decision (e.g. "use Zod for validation"); it is read every session.
- One phase (or one mode) per session; use `/clear` between phases.
- Ask for tests alongside features, and run the app yourself before moving on. You are the user, so the typing experience is yours to judge.
- Write the task JSON files yourself where you can. Designing good tasks teaches as much as solving them.
