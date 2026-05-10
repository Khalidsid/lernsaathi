# Slice 3.15 Brief: Active Learning Interaction Components

**Status:** planned  
**Depends on:** Slice 3.14 problem-first landing screen  
**Blocks:** Slice 3.16 journey screens  
**Primary protocol:** `docs/LOW_REASONING_DEV_PROTOCOL.md`  
**Navigation protocol:** `docs/DOC_NAVIGATION.md`  

---

## 0. Context Navigation

Read in this order:

1. `docs/DOC_NAVIGATION.md` - prevents broad context loading.
2. `docs/LOW_REASONING_DEV_PROTOCOL.md` - execution rules and low-judgment work packet format.
3. `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md` - UI/accessibility, AI/model, privacy, and drift gates.
4. `docs/SLICE_MAP.md` - confirms Slice 3.15 status and dependencies.
5. `docs/PROBLEM_FIRST_LEARNING_JOURNEYS.md` - learning principles and journey flow requirements.
6. `docs/UX_ARCHITECTURE.md` - state, mobile, accessibility, motion, and voice rules.
7. `docs/COMPONENT_CONTRACTS.md` - component ownership and non-goals.
8. `docs/NAMING.md` - prop, state, callback, and file naming rules.
9. `components/AssistantBlock.tsx`, `components/AttemptInput.tsx`, `components/ChhotaCheck.tsx` - existing answer/check/attempt patterns to reuse or avoid conflicting with.

Do not read:

- Prompt files unless this slice is explicitly upgraded to generate quiz data from the model.
- API routes unless saving quiz attempts is explicitly added to this slice.
- Prisma schema unless persistence is explicitly added to this slice.

---

## 1. Goal

Add reusable active-learning UI components that can turn explanations into low-cognitive-load practice: quick checks, production prompts, and small reward feedback.

This slice creates UI primitives only. It does not change model prompts or save quiz analytics unless the brief is explicitly upgraded.

---

## 1.5. ⚠️ CONSTRAINT CARD (Check Before EVERY Edit)

**Allowed files (section 2)**:

- `components/QuickCheck.tsx` (new)
- `components/ProductionPrompt.tsx` (new)
- `components/LearningReward.tsx` (new)
- `components/JourneyStepCard.tsx` (new)
- `docs/COMPONENT_CONTRACTS.md`
- `docs/UX_ARCHITECTURE.md`
- `docs/SLICE_MAP.md`
- focused unit/component tests if test tooling exists

**Forbidden areas (section 3)**:

- `lib/pipeline/*` (STOP unless prompt/model scope is explicitly approved)
- `prompts/*` (STOP unless eval/prompt scope is explicitly approved)
- `app/api/*` (STOP unless persistence is explicitly approved)
- `prisma/*` (STOP unless schema decision is explicitly approved)
- Existing chat response rendering refactor (STOP if broader than adding optional component usage)

**Expected git diff**:

```text
A components/QuickCheck.tsx
A components/ProductionPrompt.tsx
A components/LearningReward.tsx
A components/JourneyStepCard.tsx
M docs/COMPONENT_CONTRACTS.md
M docs/UX_ARCHITECTURE.md
M docs/SLICE_MAP.md
```

**Mandatory checks before committing**:

- [ ] Only allowed files modified?
- [ ] Components work without backend persistence?
- [ ] No fake save/progress controls added?
- [ ] `QuickCheck` supports mouse and keyboard selection?
- [ ] `QuickCheck` gives immediate correct/incorrect feedback?
- [ ] `ProductionPrompt` supports submit, disabled, pending, and error states?
- [ ] `LearningReward` is small and non-blocking?
- [ ] 375px layout checked?
- [ ] Dark mode checked?
- [ ] `npm run typecheck` passes?
- [ ] `npm run lint` passes?
- [ ] `npm run build` passes?

**Stop conditions (section 12)**:

- Component needs generated quiz data from model prompts.
- Saving answer performance requires a new API or schema.
- UI cannot truthfully show progress without persistence.
- More than 6 source files need changes.

---

## 2. Allowed Scope

New components:

- `components/JourneyStepCard.tsx`
- `components/QuickCheck.tsx`
- `components/ProductionPrompt.tsx`
- `components/LearningReward.tsx`

Docs:

- `docs/COMPONENT_CONTRACTS.md`
- `docs/UX_ARCHITECTURE.md`
- `docs/SLICE_MAP.md`

Tests:

- Focused tests only if existing tooling supports them without dependency installation.

---

## 3. Explicit Non-Goals

- Do not change prompts.
- Do not generate quizzes through the model.
- Do not persist quiz attempts.
- Do not add XP/streak persistence.
- Do not create a full journey page.
- Do not refactor `AssistantBlock` unless this brief is upgraded.

---

## 4. Component Specifications

### 4.1 `JourneyStepCard`

Purpose: standard container for one step inside a learning journey.

Props:

```ts
type JourneyStepCardProps = {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};
```

Visual:

- `rounded-lg`
- `border border-rule dark:border-[#2E2E2B]`
- `bg-paper2 dark:bg-night2`
- `p-4 sm:p-5`
- No nested cards inside it unless rendering a repeated answer option.
- Title: `serif text-[22px] leading-[1.2] text-ink dark:text-mist`.
- Eyebrow: `text-[11px] uppercase tracking-[0.08em] text-ink4`.

### 4.2 `QuickCheck`

Purpose: recognition practice after an explanation.

Props:

```ts
type QuickCheckOption = {
  id: string;
  label: string;
  isCorrect: boolean;
  explanation?: string;
};

type QuickCheckProps = {
  question: string;
  options: QuickCheckOption[];
  onComplete?: (result: { optionId: string; isCorrect: boolean }) => void;
};
```

Rules:

- Options render as real buttons, not radios, to reduce interaction steps.
- Exactly 2-4 options.
- No option may be empty.
- On click/Enter, selected option locks the check.
- Correct option style:
  - border `border-emerald-500`
  - background `bg-emerald-50 dark:bg-emerald-950/30`
  - text `text-emerald-800 dark:text-emerald-300`
- Incorrect selected option style:
  - border `border-rose-500`
  - background `bg-rose-50 dark:bg-rose-950/30`
  - text `text-rose-800 dark:text-rose-300`
- Feedback text:
  - Correct: `Correct. Aapne point pakad liya.`
  - Incorrect: `Not quite. Correct answer ko dobara dekhiye.`
- Feedback uses `role="status"` and `aria-live="polite"`.

### 4.3 `ProductionPrompt`

Purpose: recall/production step after recognition.

Props:

```ts
type ProductionPromptProps = {
  prompt: string;
  placeholder: string;
  isPending?: boolean;
  errorMessage?: string | null;
  onSubmit: (value: string) => void | Promise<void>;
};
```

Rules:

- Uses a textarea.
- Min height: `96px`.
- Submit button label: `Check`.
- Disabled until trimmed value length is at least 2.
- Error text uses `role="alert"`.
- No automatic save claim unless parent actually persists.

### 4.4 `LearningReward`

Purpose: small reward after a successful check or completed step.

Props:

```ts
type LearningRewardProps = {
  tone: "correct" | "practice" | "saved";
  message: string;
};
```

Rules:

- Small inline block, not modal.
- Max height target: `40px`.
- Uses calm copy, not childish reward language.
- Allowed messages:
  - `Good. This is ready for practice.`
  - `Saved for revision.`
  - `One step completed.`
- No confetti or large celebration animation.

---

## 5. UX States

| State | Expected Behavior |
|---|---|
| Happy path | User answers check, sees immediate feedback, then can continue. |
| Loading | `ProductionPrompt` disables submit and shows `Checking...` if parent is pending. |
| Empty | Disabled submit until input is sufficient. |
| Error | Inline error appears with `role="alert"`. |
| Disabled | Buttons/submit have visible disabled state. |
| Success | `LearningReward` appears as small feedback. |

---

## 6. API/Data Contract

- Routes touched: none.
- Request schema: none.
- Response schema: none.
- Database models touched: none.
- Idempotency behavior: not applicable.
- Rate limit behavior: not applicable.
- Logging behavior: not applicable.

This slice does not persist quiz answers. If persistence is needed, stop and create a separate API/data slice.

---

## 7. Accessibility And Mobile

- All answer options are buttons.
- Tab order follows visual order.
- Enter/Space activates each option.
- Selected/correct/incorrect state must not rely on color only; include text feedback.
- 375px: options stack vertically.
- Desktop: options may use 2-column grid only if labels remain readable.
- Focus ring visible.
- Reduced motion respected.

---

## 8. Implementation Steps

1. Add `JourneyStepCard`.
2. Add `QuickCheck`.
3. Add `ProductionPrompt`.
4. Add `LearningReward`.
5. Add or update docs contracts for these components.
6. Create small local examples only if they are not user-visible in production.
7. Run validation.
8. Update `docs/SLICE_MAP.md`.

---

## 9. Validation

Run:

```bash
npm run typecheck
npm run lint
npm run build
npm run validate:slice docs/slices/SLICE_3_15_BRIEF.md
```

Manual:

- Keyboard select option in `QuickCheck`.
- Incorrect answer shows feedback.
- Correct answer shows feedback.
- `ProductionPrompt` disabled state.
- 375px layout.
- Dark mode.

---

## 10. Accountability Gates

- Changed-files audit: required.
- Security gate: not applicable.
- Privacy/data gate: pass because no new persistence.
- AI/model gate: pass because no prompt/model changes.
- UI/accessibility gate: required.
- Reliability/deployment gate: build must pass.
- Rollback path: remove new components and references.

---

## 11. Stop Conditions

Stop if:

- A model-generated quiz schema becomes necessary.
- A database model becomes necessary.
- Analytics or scoring persistence becomes necessary.
- The implementation starts changing existing chat behavior broadly.

---

## 12. Completion Report Format

```markdown
Changed:
- `components/JourneyStepCard.tsx`: [summary]
- `components/QuickCheck.tsx`: [summary]
- `components/ProductionPrompt.tsx`: [summary]
- `components/LearningReward.tsx`: [summary]

Validation:
- `npm run typecheck`: pass/fail
- `npm run lint`: pass/fail
- `npm run build`: pass/fail
- `npm run validate:slice docs/slices/SLICE_3_15_BRIEF.md`: pass/fail

Manual:
- QuickCheck keyboard path: pass/fail
- QuickCheck feedback: pass/fail
- ProductionPrompt disabled/error states: pass/fail
- 375px layout: pass/fail
- Dark mode: pass/fail

Accountability:
- Changed-files audit: pass/fail
- Drift report needed: yes/no
- Debt opened: [ids or none]
- Waivers: [ids or none]
- Privacy gate: pass/fail/not applicable
- AI/model gate: pass/fail/not applicable
- Manual evidence: complete/pending/not applicable
```
