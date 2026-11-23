# Plan: mic button + voice transcription

Status: implemented (sections 1–3, 5). The hook and button ended up together in
`src/components/mic-button.tsx` instead of a separate `src/lib/dictation.ts`.

## Approach

Use the browser's Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`).
No new dependency, no backend, no API key, live text as you speak.

Ceiling: works in Chrome, Edge and Safari; not Firefox. Chrome sends the audio to
Google for recognition. If that matters (privacy, Firefox, accuracy), the upgrade
path is in "Later" below.

## Changes, by file

### 1. New `src/lib/dictation.ts` (one small hook)

`useDictation(onText: (text: string) => void)` returning `{ supported, listening, toggle }`.

- `supported`: `typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)`.
  Must be false during SSR so the button doesn't render on the server and mismatch.
- On `toggle()` start: `rec.continuous = true`, `rec.interimResults = false`,
  `rec.lang = navigator.language`. In `onresult`, call `onText` for each result
  where `isFinal` is true.
- `onend` → `listening = false` (Chrome stops itself after silence).
- `onerror`: `not-allowed` → tell the user mic access is blocked; others → stop quietly.
- Stop the recognizer in the effect cleanup so switching drafts doesn't leave the mic on.
- Add a `SpeechRecognition` type declaration here (TypeScript's DOM lib doesn't ship one).

### 2. `src/components/editor-toolbar.tsx`: mic button in the draft toolbar

Put it **outside** `spec.tools.map(...)`, between the `"{platform.label} tools"`
label and the `EllipsisVertical` menu (around line 175). Reason: `spec.tools` mirrors each
site's real toolbar, and no target site has a mic, so it shouldn't be a `ToolId` in
`src/lib/platforms.ts`.

- A `Toggle` with `Mic` / `MicOff` from `lucide-react` (already installed),
  `pressed={listening}`, `aria-label="Dictate"`, tooltip "Dictate".
- Hide it when `!supported`.
- `onText` → `editor.chain().focus().insertContent(text.trim() + " ").run()`
  (inserts at the cursor, goes through `onUpdate`, so the draft saves as normal).
- While listening, give the button a visible state (e.g. `text-red-600 animate-pulse`)
  so it's obvious the mic is live.

### 3. `src/routes/index.tsx`: mic on the "Add an idea…" input (lines ~126–134)

Optional, but cheap with the same hook: a mic button inside the idea `<form>`; `onText`
appends to `idea` via `setIdea((s) => (s ? s + " " : "") + text)`. Enter still submits.

### 4. `src/components/slash-command.tsx`: skip

A "/dictate" item would be possible, but items are keyed to `ToolId` (`needs: ToolId[]`)
and the toolbar button already covers it.

### 5. Analytics

`track("dictation_started")` from `@databuddy/sdk` when listening starts, in the hook,
matching `track(...)` calls in `preview.tsx` and `auth-form.tsx`.

### 6. Headers / permissions

No `Permissions-Policy` header is set anywhere today, so the mic is allowed on the
same origin. If one is added later, it needs `microphone=(self)`. HTTPS is already
the case on `drafts.saranatour.dev`; `localhost` counts as secure in dev.

### 7. Tests

The recognizer needs a browser, so no `node --test` file. Check by hand in Chrome:
start/stop, text lands at the cursor, draft saves, switching drafts turns the mic off,
denied permission shows a message, Firefox hides the button.

## Not changing

- `convex/`: no schema or function changes; text is stored as part of the draft markdown.
- `src/lib/platforms.ts`: no new `ToolId`.
- `package.json`: no new dependencies.

## Later (only if the Web Speech API falls short)

Record with `MediaRecorder` → upload the clip with the same pattern as
`uploadImage` in `src/components/editor.tsx` (`convex/images.ts` `generateUploadUrl`)
→ a new Convex action (`convex/transcribe.ts`) that sends it to a speech-to-text API
and returns text. That needs an API key in Convex env, a size/length limit on uploads,
and auth checks like the image mutations. Gains Firefox support and accuracy; loses
live typing.
