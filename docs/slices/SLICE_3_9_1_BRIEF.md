# Slice 3.9.1 Brief: Retroactive 3.9 Realignment

**Status:** verified locally (manual evidence pending)  
**Primary protocol:** `docs/LOW_REASONING_DEV_PROTOCOL.md`  
**Detailed notes:** `docs/SLICE_3_9_1_RETROACTIVE_REALIGNMENT_NOTES.md`  
**Purpose:** Clean up Slice 3.9 under the new low-reasoning, evidence-first process before Slice 3.10 and Slice 4.

---

## 0. Context Navigation

Read in this order:

1. `docs/DOC_NAVIGATION.md` - prevents broad context loading.
2. `docs/LOW_REASONING_DEV_PROTOCOL.md` - execution rules and stop conditions.
3. `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md` - changed-files audit and evidence/debt rules.
4. `docs/SLICE_MAP.md` - confirms current status and blockers.
5. `docs/SLICE_3_9_1_RETROACTIVE_REALIGNMENT_NOTES.md` - explains the narrow correction scope.
6. `docs/UX_ARCHITECTURE.md`, `docs/COMPONENT_CONTRACTS.md`, `docs/NAMING.md` - only for UI and naming rules touched by this brief.
7. `app/api/learning-state/route.ts`, `components/RevisionCard.tsx`, `components/LearningStatePanel.tsx` - the exact implementation files.

Do not read:

- Full retrospective unless a P0 rule is unclear.
- Prompt docs unless response behavior unexpectedly changes.

---

## 1. Goal

Fix the narrow correctness and validation gaps in the current revision/learning-state surfaces without adding new product scope.

---

## 2. Allowed Scope

- `app/api/learning-state/route.ts`
- `components/RevisionCard.tsx`
- `components/LearningStatePanel.tsx`
- `docs/SLICE_MAP.md`
- `docs/SLICE_3_9_1_RETROACTIVE_REALIGNMENT_NOTES.md`
- `docs/RELEASE_EVIDENCE_SLICE_3_9_1.md`

---

## 3. Explicit Non-Goals

- Do not implement image upload.
- Do not add route-level `loading.tsx` or `error.tsx`.
- Do not add distributed rate limiting.
- Do not migrate all API routes to a new error envelope.
- Do not add new database tables unless explicitly approved.
- Do not change OpenAI prompts.
- Do not add new revision gestures, streaks, or celebrations.
- Do not broadly refactor components.

---

## 4. Required Reads

- `docs/LOW_REASONING_DEV_PROTOCOL.md`
- `docs/SLICE_3_9_1_RETROACTIVE_REALIGNMENT_NOTES.md`
- `docs/UX_ARCHITECTURE.md`
- `docs/COMPONENT_CONTRACTS.md`
- `docs/NAMING.md`
- `docs/SLICE_MAP.md`
- `app/api/learning-state/route.ts`
- `components/RevisionCard.tsx`
- `components/LearningStatePanel.tsx`

---

## 5. UX States

| State | Expected Behavior |
|---|---|
| Happy path | Revision reveal/rate and learning state counts continue to work. |
| Loading | Learning state skeleton remains visible and gets low-risk accessibility metadata. |
| Empty | Existing empty states remain unchanged. |
| Error | Existing inline retry/error behavior remains visible. |
| Disabled | Revision buttons remain disabled while saving. |
| Success | Review completion can be reflected in today's Done count after refresh. |

---

## 6. API/Data Contract

- Routes touched: `/api/learning-state`.
- Request schema: unchanged.
- Response schema: unchanged.
- Database models touched: no schema changes.
- Idempotency behavior: unchanged.
- Rate limit behavior: unchanged.
- Logging behavior: unchanged.

Decision:

- For 3.9.1, `todayReviews` should count `Mistake` rows with `lastReviewedAt >= startOfToday`.
- Document limitation: this counts unique reviewed mistakes today, not every review attempt.

---

## 7. Accessibility And Mobile

- Add text-entry guard to revision keyboard shortcuts.
- Add low-risk `aria-busy` / `aria-live` metadata to learning state panel.
- Preserve 375px mobile layout.
- Preserve reduced-motion behavior.

---

## 8. Implementation Steps

1. Update `docs/SLICE_MAP.md` with Slice 3.9.1 row and current status.
2. Change `todayReviews` query in `app/api/learning-state/route.ts`.
3. Add text-entry guard to `components/RevisionCard.tsx`.
4. Add low-risk ARIA metadata to `components/LearningStatePanel.tsx`.
5. Create `docs/RELEASE_EVIDENCE_SLICE_3_9_1.md`.
6. Run validation.
7. Update evidence and slice status.

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

Do not run `npm run eval` unless prompts or model behavior changed.

---

## 10. Stop Conditions

Stop if:

- Fixing `todayReviews` requires a schema migration.
- Keyboard guard causes broad component changes.
- Accessibility metadata creates confusing screen reader behavior.
- Manual validation cannot be performed.
- Unexpected worktree changes affect touched files.

---

## 11. Completion Evidence

- Commands run:
- Manual checks:
- Known limitations:
- Status recommendation:
