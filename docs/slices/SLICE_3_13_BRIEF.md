# Slice 3.13 Brief: Evidence Pass And Debt Triage

**Status:** planned  
**Primary protocol:** `docs/LOW_REASONING_DEV_PROTOCOL.md`  
**Purpose:** Convert local implementation into verified evidence and close P0 correctness gaps before Slice 4.

---

## 0. Context Navigation

Read in this order:

1. `docs/DOC_NAVIGATION.md` - prevents broad context loading.
2. `docs/LOW_REASONING_DEV_PROTOCOL.md` - execution rules and evidence language.
3. `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md` - release evidence, debt closure, waiver, and drift rules.
4. `docs/SLICE_MAP.md` - confirms which slices are implemented, verified, or evidence-pending.
5. `docs/gates/EVIDENCE_MATRIX.md` - defines validation matrix and release blockers.
6. `docs/gates/DEFINITION_OF_DONE.md` - quality gates for all slices.
7. `docs/gates/TECH_DEBT_REGISTER.md` - P0 items addressed in this slice.
8. `docs/gates/SLICE_4_ENTRY_CRITERIA.md` - gates that must pass before Slice 4.
9. `docs/UX_ARCHITECTURE.md` - manual UI evidence must use the UI contract.
10. `app/api/learning-state/route.ts`, `app/api/revision/review/route.ts`, `lib/revision-data.ts` - review-count correctness path.
11. `components/LearningStatePanel.tsx`, `components/RevisionQueue.tsx`, `components/Toast.tsx` - affected feedback and evidence surfaces.

Do not read:

- Prompt docs unless a validation failure points to response behavior.
- Legacy slice notes unless evidence contradicts current `SLICE_MAP.md`.

---

## 1. Goal

Fix known correctness debt, run the validation matrix, and update status docs so future slices start from accurate evidence.

---

## 1.5. ⚠️ CONSTRAINT CARD (Check Before EVERY Edit)

**Allowed files (section 2)**:
- `app/api/learning-state/route.ts`
- `app/api/revision/review/route.ts`
- `lib/revision-data.ts`
- `prisma/schema.prisma` (ONLY if adding review table - requires decision in section 6)
- `prisma/migrations/*` (ONLY if schema change)
- `components/Toast.tsx`
- components that integrate or remove Toast
- `docs/RELEASE_EVIDENCE_SLICE_3_13.md`
- `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md`
- `docs/SLICE_MAP.md`
- `docs/RETROSPECTIVE_ARCHITECTURAL_ANALYSIS.md` (debt register only)

**Forbidden areas (section 3)**:
- Image upload implementation
- New learning modules
- App redesign
- Broad analytics implementation
- Prompt behavior changes (STOP unless validation issue requires it)

**Expected git diff (section 6 decision)**:
Fast path (LearningEvent):
```
M app/api/revision/review/route.ts
M lib/revision-data.ts
M components/Toast.tsx (if integrated/removed)
A docs/RELEASE_EVIDENCE_SLICE_3_13.md
M docs/ACCOUNTABILITY_AND_QUALITY_GATES.md
M docs/SLICE_MAP.md
```

Durable path (RevisionReview table):
```
M prisma/schema.prisma
A prisma/migrations/*
M app/api/revision/review/route.ts
M lib/revision-data.ts
M components/Toast.tsx (if integrated/removed)
A docs/RELEASE_EVIDENCE_SLICE_3_13.md
M docs/ACCOUNTABILITY_AND_QUALITY_GATES.md
M docs/SLICE_MAP.md
```

**Mandatory checks before committing**:
- [ ] Only allowed files modified?
- [ ] Today's review count data source chosen (section 6)?
- [ ] Review count reflects actually persisted state (not client-only)?
- [ ] Revision queue reflects persisted state?
- [ ] Failed review/save visible and retryable?
- [ ] Review buttons disable while pending?
- [ ] Review completion updates due count correctly?
- [ ] Review completion updates today's review count correctly?
- [ ] Toast decision made (integrated or removed)?
- [ ] Manual validation matrix run (section 7)?
- [ ] `docs/RELEASE_EVIDENCE_SLICE_3_13.md` created?
- [ ] `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md` debt statuses updated?
- [ ] `docs/SLICE_MAP.md` updated with exact status words?

**Stop conditions (section 10)**:
- Today's review count requires schema decision not made
- Manual validation cannot be performed
- Fixing Toast integration expands into broad notification architecture
- Existing data makes count behavior ambiguous

---

## 2. Allowed Scope

- `app/api/learning-state/route.ts`
- `app/api/revision/review/route.ts`
- `lib/revision-data.ts`
- `prisma/schema.prisma` and migration only if adding a review table
- `components/Toast.tsx`
- components that integrate or remove Toast
- `docs/RELEASE_EVIDENCE_SLICE_3_13.md`
- `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md`
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
- `docs/gates/EVIDENCE_MATRIX.md`
- `docs/gates/DEFINITION_OF_DONE.md`
- `docs/gates/TECH_DEBT_REGISTER.md`
- `docs/gates/SLICE_4_ENTRY_CRITERIA.md`
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
8. Update `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md` debt statuses, waivers, and closure evidence.
9. Update `docs/SLICE_MAP.md` using exact status words.

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
