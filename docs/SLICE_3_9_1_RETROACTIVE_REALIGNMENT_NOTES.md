# Slice 3.9.1: Retroactive Realignment Notes

**Status:** verified locally (manual evidence pending)  
**Date opened:** 2026-05-09  
**Primary protocol:** `docs/LOW_REASONING_DEV_PROTOCOL.md`  
**Slice brief:** `docs/slices/SLICE_3_9_1_BRIEF.md`  
**Purpose:** Make Slice 3.9 honest under the new low-reasoning, evidence-first development process before starting Slice 3.10 or Slice 4.

---

## 1. Why This Slice Exists

Slice 3.9 added valuable revision UX, but the new retrospective showed that "implemented locally" is not enough. Slice 3.9.1 is a retroactive cleanup slice. It should not add new product scope. It should fix correctness and evidence gaps that make the current 3.9 status weaker than the new process requires.

This slice is designed for a lower-reasoning model. Each task has:

- Exact file scope.
- A small implementation target.
- Stop conditions.
- Validation expectations.
- Clear non-goals.

---

## 2. Non-Goals

Do not implement:

- Image upload.
- Route `loading.tsx` / `error.tsx` boundaries.
- Distributed rate limiting.
- API error envelope migration.
- Zod validation across all routes.
- OpenAI safety identifier.
- Storybook, visual regression, or broad e2e setup.
- Broad component refactors.
- New revision gestures, streaks, celebrations, or gamification.

Those belong to later slices.

---

## 3. Current Inconsistencies To Resolve

| Issue | Evidence | 3.9.1 Direction |
|---|---|---|
| `todayReviews` count is inaccurate | `app/api/learning-state/route.ts` counts `LearningEvent.inputType = "revision_attempt"`, but revision review does not create that event. | Use `Mistake.lastReviewedAt` as the fast source for 3.9.1, and document the limitation. |
| Revision shortcuts are too global | `components/RevisionCard.tsx` listens on `window` and handles keys without checking text-entry targets. | Add a text-entry guard before shortcut handling. |
| Learning state accessibility is incomplete | `LearningStatePanel` has loading/error states but no `aria-busy` or `aria-live` strategy. | Add low-risk ARIA metadata. |
| Toast component is not integrated | `components/Toast.tsx` exists but is not wired into revision save or learning state flows. | Do not integrate in 3.9.1 unless it is a tiny change. Document as not part of 3.9 completion. |
| Slice evidence is missing | Slice 3.9 says manual browser testing recommended. | Create release evidence doc and record what was checked or remains pending. |
| Status language is old | Historical docs say "complete locally". | Use `implemented locally`, `verified locally`, or `manual evidence pending` from now on. |

---

## 4. Work Packet A: Learning State Count Correctness

### Goal

Make `todayReviews` reflect data actually written by the current revision review path.

### Allowed Files

- `app/api/learning-state/route.ts`
- `docs/SLICE_3_9_1_RETROACTIVE_REALIGNMENT_NOTES.md`
- `docs/RELEASE_EVIDENCE_SLICE_3_9_1.md` after it exists

### Do Not Touch

- `prisma/schema.prisma`
- Prisma migrations
- `lib/revision-data.ts`
- `app/api/revision/review/route.ts`
- Prompt files

### Exact Implementation

Change `todayReviews` query from `LearningEvent.inputType = "revision_attempt"` to counting mistakes reviewed today:

```ts
db.mistake.count({
  where: {
    userId,
    lastReviewedAt: {
      gte: startOfToday,
    },
  },
})
```

### Known Limitation To Document

This counts unique mistakes reviewed today, not every review button press. That is acceptable for 3.9.1 because `reviewRevisionItem` currently updates `Mistake.lastReviewedAt`. A future analytics slice can add a dedicated `RevisionReview` table if exact review attempts matter.

### Stop Conditions

- Stop if the query requires a schema migration.
- Stop if the change requires modifying revision review transaction behavior.

### Validation

- `npm run typecheck`
- `npm run lint`
- Manual: review one due card, refresh learning state, confirm `Done` can increase.

---

## 5. Work Packet B: Revision Keyboard Guard

### Goal

Prevent revision shortcuts from firing while the learner is typing in an input, textarea, select, or contenteditable element.

### Allowed Files

- `components/RevisionCard.tsx`

### Do Not Touch

- `components/RevisionQueue.tsx`
- `app/api/revision/review/route.ts`
- `lib/revision.ts`

### Exact Implementation

Add a local helper near the top of `RevisionCard.tsx`:

```ts
function isTextEntryTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}
```

Then add this at the top of `handleKeyPress` after the pending check:

```ts
if (isTextEntryTarget(event.target)) {
  return;
}
```

### Stop Conditions

- Stop if TypeScript DOM types are unavailable.
- Stop if this creates lint errors that require broad config changes.

### Validation

- `npm run typecheck`
- `npm run lint`
- Manual: revision shortcuts still work on card.
- Manual: shortcuts do not fire while focus is in a text input.

---

## 6. Work Packet C: Learning State Accessibility Metadata

### Goal

Make loading and dynamic count changes easier for assistive technology without redesigning the panel.

### Allowed Files

- `components/LearningStatePanel.tsx`

### Do Not Touch

- `app/api/learning-state/route.ts` unless doing Work Packet A in the same session.
- `app/globals.css`
- `components/AppShell.tsx`

### Preferred Implementation

Add low-risk metadata:

- Add `aria-busy="true"` to the skeleton wrapper.
- Add `aria-live="polite"` to the loaded panel or count group.
- Ensure the refresh icon is decorative with `aria-hidden="true"` if not already.

### Stop Conditions

- Stop if the change requires restructuring the component tree.
- Stop if the panel becomes noisy for screen readers.

### Validation

- `npm run typecheck`
- `npm run lint`
- Manual: panel still renders loading, error, and loaded states.

---

## 7. Work Packet D: Toast Decision

### Goal

Remove ambiguity around `components/Toast.tsx`.

### Allowed Files

- `docs/SLICE_3_9_1_RETROACTIVE_REALIGNMENT_NOTES.md`
- `docs/SLICE_MAP.md`
- `docs/RELEASE_EVIDENCE_SLICE_3_9_1.md` after it exists
- `components/Toast.tsx` only if removing unused code is explicitly chosen

### Recommended Decision For 3.9.1

Do not integrate Toast in 3.9.1. Keep revision save errors inline. Document that Toast is available but not part of the 3.9 completion surface.

Reason:

- Integrating Toast touches feedback architecture beyond the narrow 3.9.1 goal.
- Inline errors are more reliable for save failures.
- Toast integration can be reconsidered in Slice 3.11 or 3.13.

### Stop Conditions

- Stop if integrating Toast requires changes in more than two components.
- Stop if removing Toast would conflict with pending user changes.

---

## 8. Work Packet E: Release Evidence Scaffold

### Goal

Create an evidence doc for Slice 3.9.1.

### Allowed Files

- `docs/RELEASE_EVIDENCE_SLICE_3_9_1.md`
- `docs/SLICE_MAP.md`

### Required Evidence Sections

Use this structure:

```markdown
# Release Evidence: Slice 3.9.1

## Automated Validation

| Command | Result | Notes |
|---|---|---|
| npm run typecheck | pending |  |
| npm run lint | pending |  |
| npm run test:unit | pending |  |
| npm run check:policy | pending |  |
| npm run build | pending |  |

## Manual Validation

| Flow | Result | Notes |
|---|---|---|
| Revise reveal with mouse/touch | pending |  |
| Revise reveal with keyboard | pending |  |
| Review buttons 1-4 | pending |  |
| Keyboard guard inside text input | pending |  |
| Learning state Done count | pending |  |
| 375px mobile viewport | pending |  |
| Light theme | pending |  |
| Dark theme | pending |  |

## Known Limitations

- [list]

## Status Recommendation

- [implemented locally / verified locally / manual evidence pending / complete]
```

### Stop Conditions

- Stop if manual validation cannot be performed. Mark it as pending instead of claiming completion.

---

## 9. Work Packet F: Slice Map Update

### Goal

Make the roadmap reflect Slice 3.9.1 explicitly.

### Allowed Files

- `docs/SLICE_MAP.md`

### Required Updates

Add row after 3.9:

```markdown
| 3.9.1 | Retroactive 3.9 Realignment | Review-count correctness, keyboard shortcut guard, learning-state a11y, evidence scaffold |
```

Add status line:

```markdown
- Slice 3.9.1: [planned / implemented locally / verified locally]. Notes live at `docs/SLICE_3_9_1_RETROACTIVE_REALIGNMENT_NOTES.md`; brief lives at `docs/slices/SLICE_3_9_1_BRIEF.md`. Blocks Slice 3.10 and Slice 4 until manual evidence is recorded.
```

### Stop Conditions

- Stop if the slice map already contains a conflicting 3.9.1 entry.

---

## 10. Required Validation For 3.9.1

Run after implementation:

```bash
npm run typecheck
npm run lint
npm run test:unit
npm run check:policy
npm run build
```

Run `npm run eval` only if prompts or model behavior changed. They should not change in 3.9.1.

---

## 11. Completion Rules

3.9.1 can be marked:

- `implemented locally` after code/doc changes exist.
- `verified locally` after automated validation passes.
- `manual evidence pending` if browser/device checks are not done.
- `complete` only after automated validation and required manual evidence are recorded.

Do not mark 3.9.1 `complete` just because typecheck passes.

---

## 12. Recommended Task Order

Use this order for a low-reasoning model:

1. Work Packet F: add slice map entry if not already done.
2. Work Packet A: fix `todayReviews`.
3. Work Packet B: add revision keyboard guard.
4. Work Packet C: add learning state ARIA metadata.
5. Work Packet D: document Toast decision.
6. Work Packet E: create release evidence scaffold.
7. Run automated validation.
8. Fill evidence doc.
9. Update status in `docs/SLICE_MAP.md` to match the evidence.
