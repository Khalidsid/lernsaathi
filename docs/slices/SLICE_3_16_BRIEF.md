# Slice 3.16 Brief: Problem Journey Screens

**Status:** planned  
**Depends on:** Slice 3.14 problem launcher and Slice 3.15 active-learning components  
**Blocks:** Image/audio/writing feature slices that need problem-specific entry points  
**Primary protocol:** `docs/LOW_REASONING_DEV_PROTOCOL.md`  
**Navigation protocol:** `docs/DOC_NAVIGATION.md`  

---

## 0. Context Navigation

Read in this order:

1. `docs/DOC_NAVIGATION.md` - prevents broad context loading.
2. `docs/LOW_REASONING_DEV_PROTOCOL.md` - execution rules and completion report.
3. `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md` - UI, API, privacy, AI/model, drift, and evidence gates.
4. `docs/SLICE_MAP.md` - confirms Slice 3.16 status and dependencies.
5. `docs/PROBLEM_FIRST_LEARNING_JOURNEYS.md` - exact journey flow requirements.
6. `docs/UX_ARCHITECTURE.md` - problem-first navigation, shell, mobile, accessibility, and motion rules.
7. `docs/COMPONENT_CONTRACTS.md` - contracts for `ProblemLauncher`, active-learning components, and journey shell.
8. `docs/PROMPT_PIPELINE.md` - only if routing a journey to existing chat/pipeline behavior.
9. `components/ProblemTile.tsx`, `components/JourneyStepCard.tsx`, `components/QuickCheck.tsx`, `components/ProductionPrompt.tsx` - reuse components from prior slices.
10. `app/chat/page.tsx`, `components/ChatShell.tsx`, `components/MessageList.tsx` - current chat path and empty-state behavior.

Do not read:

- Prisma schema unless this slice is explicitly upgraded to create `Conversation` or journey state tables.
- Image/audio upload files. This slice must not fake media upload.
- All prompt files. Read only exact prompt files if a journey prompt update is explicitly approved.

---

## 1. Goal

Turn the six problem tiles into focused journey entry screens with one obvious next action each. The user should not land in generic old chat history when choosing a problem.

This slice may be split into sub-slices:

- `3.16A`: `WOERTER` journey.
- `3.16B`: `LESEN` journey.
- `3.16C`: `SCHREIBEN` journey.
- `3.16D`: `GRAMMATIK` journey.
- `3.16E`: `HOEREN` journey.
- `3.16F`: `WIEDERHOLEN` journey integration polish.

If time is limited, implement only `3.16A` first.

---

## 1.5. ⚠️ CONSTRAINT CARD (Check Before EVERY Edit)

**Allowed files (section 2)**:

- `components/JourneyShell.tsx` (new)
- `app/modes/words/page.tsx` (new)
- `app/modes/reading/page.tsx` (new)
- `app/modes/writing/page.tsx` (new)
- `app/modes/grammar/page.tsx` (new)
- `app/modes/listening/page.tsx` (new)
- `components/ProblemLauncher.tsx` (update tile hrefs only)
- `components/ProblemTile.tsx` (only if active/focus behavior needs a shared fix)
- existing active-learning components from Slice 3.15
- `docs/SLICE_MAP.md`
- focused journey docs/evidence files if created

**Forbidden areas (section 3)**:

- `prisma/*` (STOP unless a separate conversation/thread slice is approved)
- `app/api/*` (STOP unless journey submit needs a scoped API brief)
- `lib/pipeline/*` and `prompts/*` (STOP unless this slice is explicitly upgraded for model routing)
- Chat history sidebar/thread model (separate slice)
- Message timestamps (separate slice)
- Audio/image upload controls (STOP until real support exists)

**Expected git diff for first sub-slice (`3.16A`)**:

```text
A components/JourneyShell.tsx
A app/modes/words/page.tsx
M components/ProblemLauncher.tsx
M docs/SLICE_MAP.md
```

**Mandatory checks before committing**:

- [ ] Only allowed files modified?
- [ ] Journey route requires auth?
- [ ] Journey route has back link to `/dashboard`?
- [ ] Journey screen has exactly one primary next action above the fold?
- [ ] No old chat history is shown by default?
- [ ] No fake audio/image/upload controls?
- [ ] 375px layout works?
- [ ] Keyboard path works?
- [ ] Dark mode works?
- [ ] `npm run typecheck` passes?
- [ ] `npm run lint` passes?
- [ ] `npm run build` passes?

**Stop conditions (section 12)**:

- Journey needs new persisted conversation state.
- Journey needs new prompt/model contract.
- Journey needs a new API route.
- More than one journey becomes necessary to finish one sub-slice.

---

## 2. Allowed Scope

Shared shell:

- `components/JourneyShell.tsx`

Routes:

- `app/modes/words/page.tsx`
- `app/modes/reading/page.tsx`
- `app/modes/writing/page.tsx`
- `app/modes/grammar/page.tsx`
- `app/modes/listening/page.tsx`

Launcher wiring:

- `components/ProblemLauncher.tsx`

Docs:

- `docs/SLICE_MAP.md`
- Optional sub-slice evidence doc if manual checks are run.

---

## 3. Explicit Non-Goals

- Do not implement real chat thread history.
- Do not implement message timestamps.
- Do not persist journey progress.
- Do not add media upload.
- Do not change database schema.
- Do not make all six journeys feature-complete in one commit.
- Do not create fake mode screens that only say "coming soon" for active primary tiles.

---

## 4. Shared `JourneyShell` Specification

Props:

```ts
type JourneyShellProps = {
  germanLabel: string;
  englishLabel: string;
  hinglishLine: string;
  children: React.ReactNode;
};
```

Layout:

- Route content max width: `760px`.
- Padding: desktop `px-6 py-7`, mobile `px-4 py-5`.
- Back link text: `Back to problems`.
- Back link href: `/dashboard`.
- German label: `serif text-[32px] leading-none`.
- English label: `text-[12px] uppercase tracking-[0.08em] text-ink4`.
- Hinglish line: `mt-2 text-[15px] leading-[1.55] text-ink2 dark:text-[#CFCDC4]`.
- Main content spacing: `mt-5 space-y-4`.

Accessibility:

- One `h1`.
- Back link first focusable control.
- Focus ring visible.
- No global keyboard shortcuts.

---

## 5. First Journey Screen Requirements

### 5.1 `WOERTER`

Route: `/modes/words`

Above the fold:

- `JourneyShell` title:
  - German: `WOERTER`
  - English: `Words`
  - Hinglish: `Word ya phrase ka matlab samajhna`
- One `JourneyStepCard` titled `Type a German word or phrase`.
- Input placeholder: `z.B. trotzdem, Bescheid sagen, die Leistung`.
- Primary button: `Explain`.
- Secondary quiet link: `Open free chat` href `/chat`.

Initial behavior:

- No old chat messages visible.
- Submit may redirect to `/chat?mode=words&input=[encoded]` only if no scoped journey API exists.
- If redirecting, preserve the user's input.
- Do not claim the app saved anything unless it actually did.

### 5.2 `LESEN`

Route: `/modes/reading`

Above the fold:

- German: `LESEN`
- English: `Reading`
- Hinglish: `Letter, form, email ya notice padhna`
- Textarea placeholder: `German text yahan paste karein`.
- Primary button: `Understand this text`.
- Helper line: `Pehle gist milega, phir difficult words.`

### 5.3 `SCHREIBEN`

Route: `/modes/writing`

Above the fold:

- German: `SCHREIBEN`
- English: `Writing`
- Hinglish: `Message, email ya reply likhna`
- Four real option buttons:
  - `WhatsApp`
  - `Email`
  - `Official reply`
  - `Application`
- Primary next action appears only after an option is selected.

### 5.4 `GRAMMATIK`

Route: `/modes/grammar`

Above the fold:

- German: `GRAMMATIK`
- English: `Grammar`
- Hinglish: `Sentence ya grammar mistake theek karna`
- Input placeholder: `Aapka German sentence`.
- Primary button: `Check grammar`.
- Helper line: `Pehle ek main mistake fix hogi.`

### 5.5 `HOEREN`

Route: `/modes/listening`

Above the fold:

- German: `HOEREN`
- English: `Listening`
- Hinglish: `Jo suna hai uska matlab samajhna`
- Input placeholder: `Jo suna, woh type karein`.
- Primary button: `Find meaning`.
- No microphone/audio button until real audio support exists.

### 5.6 `WIEDERHOLEN`

The launcher may continue linking to `/chat?tab=revision` until a dedicated revision route exists.

Do not create a fake `/modes/review` unless it actually renders the revision queue.

---

## 6. UX States

| State | Expected Behavior |
|---|---|
| Happy path | User lands on focused journey screen with one primary action. |
| Loading | If submit is pending, button disabled and label changes to `Working...`. |
| Empty | Primary button disabled until required input/choice exists. |
| Error | Inline `role="alert"` message, calm and retryable. |
| Disabled | Disabled state visually clear and semantically disabled. |
| Success | Either journey renders the next step or redirects with preserved input. |

---

## 7. API/Data Contract

Default for this slice:

- Routes touched: UI routes only.
- Request schema: none.
- Response schema: none.
- Database models touched: none.
- Idempotency behavior: unchanged.
- Rate limit behavior: unchanged.
- Logging behavior: unchanged.

If a route needs to call `/api/chat`, reuse existing chat API through a normal form/redirect pattern only if it does not require API changes.

---

## 8. Accessibility And Mobile

- 375px screens must show heading, helper text, and primary input/action without horizontal scroll.
- Buttons minimum height: `44px`.
- Inputs have labels.
- Error text has `role="alert"`.
- Focus ring visible.
- Back link keyboard reachable.
- No hover-only information.

---

## 9. Implementation Steps For `3.16A`

1. Confirm Slice 3.14 and 3.15 exist.
2. Add `JourneyShell`.
3. Add `/modes/words`.
4. Update `ProblemLauncher` `WOERTER` tile href from `/chat?mode=words` to `/modes/words`.
5. Keep other tile hrefs unchanged unless implementing their sub-slices.
6. Validate.
7. Update `docs/SLICE_MAP.md`.

Do not implement multiple journey routes in one pass unless the human explicitly asks for that broader scope.

---

## 10. Validation

Run:

```bash
npm run typecheck
npm run lint
npm run build
npm run validate:slice docs/slices/SLICE_3_16_BRIEF.md
```

Manual:

- `/modes/words` requires auth.
- Back link returns to `/dashboard`.
- Input disabled/empty behavior works.
- Primary button preserves input or moves to next step.
- 375px layout.
- Dark mode.
- Keyboard-only path.

---

## 11. Accountability Gates

- Changed-files audit: required.
- Security gate: auth-required route.
- Privacy/data gate: no new persistence.
- AI/model gate: pass if prompts/model untouched; otherwise stop for prompt brief.
- UI/accessibility gate: required.
- Reliability/deployment gate: build must pass.
- Rollback path: remove journey route and revert launcher href.

---

## 12. Stop Conditions

Stop if:

- The journey needs its own persisted state.
- The journey needs model prompt changes.
- The journey needs a new API route.
- Audio/image controls are requested before real support exists.
- More than one journey is being implemented without explicit approval.

---

## 13. Completion Report Format

```markdown
Changed:
- `components/JourneyShell.tsx`: [summary]
- `app/modes/words/page.tsx`: [summary]
- `components/ProblemLauncher.tsx`: [summary]
- `docs/SLICE_MAP.md`: [summary]

Validation:
- `npm run typecheck`: pass/fail
- `npm run lint`: pass/fail
- `npm run build`: pass/fail
- `npm run validate:slice docs/slices/SLICE_3_16_BRIEF.md`: pass/fail

Manual:
- Auth required: pass/fail
- Back to dashboard: pass/fail
- Empty state disables action: pass/fail
- Input is preserved or next step appears: pass/fail
- 375px layout: pass/fail
- Dark mode: pass/fail
- Keyboard path: pass/fail

Accountability:
- Changed-files audit: pass/fail
- Drift report needed: yes/no
- Debt opened: [ids or none]
- Waivers: [ids or none]
- Privacy gate: pass/fail/not applicable
- AI/model gate: pass/fail/not applicable
- Manual evidence: complete/pending/not applicable
```
