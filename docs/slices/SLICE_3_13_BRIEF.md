# Slice 3.13 Brief: Evidence Pass And Debt Triage

**Status:** planned  
**Primary protocol:** `docs/LOW_REASONING_DEV_PROTOCOL.md`  
**Purpose:** Convert local implementation into verified evidence and close P0 correctness gaps before Slice 4.

---

## 1. Goal

Fix known correctness debt, run the validation matrix, and update status docs so future slices start from accurate evidence.

---

## 2. Allowed Scope

- `app/api/learning-state/route.ts`
- `app/api/revision/review/route.ts`
- `lib/revision-data.ts`
- `prisma/schema.prisma` and migration only if adding a review table
- `components/Toast.tsx`
- components that integrate or remove Toast
- `docs/RELEASE_EVIDENCE_SLICE_3_13.md`
- `docs/SLICE_MAP.md`
- `docs/RETROSPECTIVE_ARCHITECTURAL_ANALYSIS.md` debt register if needed

---

## 3. Explicit Non-Goals

- Do not implement image upload.
- Do not add new learning modules.
- Do not redesign the app.
- Do not add broad analytics.
- Do not change prompt behavior unless a validation issue requires it.

---

## 4. Required Reads

- `docs/LOW_REASONING_DEV_PROTOCOL.md`
- `docs/RETROSPECTIVE_ARCHITECTURAL_ANALYSIS.md` sections 9, 11, 12, 15
- `docs/UX_ARCHITECTURE.md`
- `app/api/learning-state/route.ts`
- `app/api/revision/review/route.ts`
- `lib/revision-data.ts`
- `components/LearningStatePanel.tsx`
- `components/RevisionQueue.tsx`
- `components/Toast.tsx`

---

## 5. UX States

| State | Expected Behavior |
|---|---|
| Happy path | Review count and revision queue reflect persisted state. |
| Loading | Existing loading states remain. |
| Empty | Empty revision/mistake states remain truthful. |
| Error | Failed review/save remains visible and retryable. |
| Disabled | Review buttons disable while pending. |
| Success | Review completion updates due count and today's review count correctly. |

---

## 6. API/Data Contract

Decision required before code:

- For today's review count, either write `LearningEvent` rows on revision review or add a dedicated review table.

Fast path:

- Write a `LearningEvent` with `inputType = "revision_attempt"` when a revision review succeeds.

Durable analytics path:

- Add `RevisionReview` table and count it.

Do not count state that is not actually persisted.

---

## 7. Accessibility And Mobile

Manual evidence required:

- 375px chat.
- 375px revision.
- 375px mistakes.
- Keyboard-only revision flow.
- Dark and light themes.
- Error/retry path where feasible.

---

## 8. Implementation Steps

1. Choose today's review count data source.
2. Implement the count fix.
3. Add tests if feasible.
4. Decide whether `Toast` is integrated or removed.
5. Run automated validation.
6. Run manual validation matrix.
7. Create `docs/RELEASE_EVIDENCE_SLICE_3_13.md`.
8. Update `docs/SLICE_MAP.md` using exact status words.

---

## 9. Validation

Run:

```bash
npm run typecheck
npm run lint
npm run test:unit
npm run check:policy
npm run build
```

Run `npm run eval` if prompts changed.

---

## 10. Stop Conditions

Stop if:

- Today's review count requires a schema decision not made.
- Manual validation cannot be performed.
- Fixing Toast integration expands into broad notification architecture.
- Existing data makes count behavior ambiguous.

---

## 11. Completion Evidence

- Commands run:
- Count fix chosen:
- Manual validation:
- Screenshots/clips location if captured:
- Known limitations:
- `docs/SLICE_MAP.md` status update:

