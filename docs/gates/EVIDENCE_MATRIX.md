# Evidence Matrix and Release Blockers

**Source:** Extracted from `RETROSPECTIVE_ARCHITECTURAL_ANALYSIS.md` section 9
**Purpose:** Defines manual validation requirements for Slice 3.13
**Context:** Close the gap between local implementation and release confidence

---

## Objective

Close the gap between local implementation and release confidence by:
- Running comprehensive manual validation matrix
- Fixing known correctness debt
- Creating release evidence documentation

---

## Required Validation Matrix

| Flow | Chrome Desktop | Safari Desktop | iOS Safari | Android Chrome | Keyboard Only | Screen Reader Smoke |
|---|---|---|---|---|---|---|
| Login | required | required | required | required | required | basic |
| Name prompt | required | required | required | required | required | basic |
| Chat send | required | required | required | required | required | basic |
| Attempt feedback | required | required | required | required | required | basic |
| Revision reveal/rate | required | required | required | required | required | basic |
| Mistakes tab | required | required | required | required | required | basic |
| Theme switch | required | required | optional | optional | required | basic |
| Error recovery | required | required | required | required | required | basic |

**Evidence format:** Record screenshots or short clips for dark/light/mobile states.

---

## Required Fixes During Evidence Pass

### 1. Fix Inaccurate `todayReviews` Logic

**Current issue:**
- `/api/learning-state` counts `LearningEvent` rows with `inputType = "revision_attempt"`
- `/api/revision/review` updates revision state but does NOT create a `LearningEvent`
- Result: Today's review count is inaccurate

**Fix options:**
- Create a `LearningEvent` for every revision review
- Add dedicated `RevisionReview` table
- Compute today's review count from `Mistake.lastReviewedAt` (with known limitations)

**Recommended:**
- **For fast repair:** Write a `LearningEvent` inside `reviewRevisionItem` transaction/route handler
- **For product analytics:** Add dedicated `RevisionReview` table

### 2. Wire `Toast` or Remove It

**Current issue:**
- `components/Toast.tsx` exists but is not integrated into core save/review flows

**Decision required:**
- Either integrate into revision save, learning state refresh, profile save flows
- OR remove it until needed

### 3. Resolve Keyboard Shortcut Conflicts

- Add text-entry guard to prevent shortcuts firing while typing
- Already partially addressed in `RevisionCard.tsx`

### 4. Confirm Modal/Menu Focus Behavior

- Ensure focus returns after closing modals
- Verify menu keyboard navigation works
- Check Escape key closes modal/menu correctly

### 5. Record Evidence

- Capture screenshots or short clips for dark/light themes
- Document mobile viewport behavior (375px minimum)
- Record keyboard-only flow completion

---

## Exit Criteria

- [ ] Evidence file exists at `docs/RELEASE_EVIDENCE_SLICE_3_13.md`
- [ ] All P0 manual checks passed or documented as release blockers
- [ ] Technical debt register updated in `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md`
- [ ] `docs/SLICE_MAP.md` reflects new status vocabulary:
  - `planned`
  - `implemented locally`
  - `verified locally`
  - `production smoke passed`
  - `complete`

---

## Using This Matrix

**Before Slice 3.13:**
- Review this matrix to understand scope
- Ensure test devices/browsers available
- Plan time for manual testing (est. 2-3 hours)

**During Slice 3.13:**
- Check each cell as you test
- Document failures immediately
- Fix P0 blockers before marking complete

**After Slice 3.13:**
- Create `RELEASE_EVIDENCE_SLICE_3_13.md` with results
- Update debt register with any new findings
- Update `SLICE_MAP.md` with accurate status
