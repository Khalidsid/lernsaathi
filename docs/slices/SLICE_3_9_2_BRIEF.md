# Slice 3.9.2 Brief: Revision Clickability Fix

**Status:** planned
**Parent:** Slice 3.9 (Revision & Mistake Practice Upgrade)
**Primary protocol:** `docs/LOW_REASONING_DEV_PROTOCOL.md`
**Navigation protocol:** `docs/DOC_NAVIGATION.md`

---

## 0. Context Navigation

Read in this order:

1. `docs/DOC_NAVIGATION.md` - confirms this is a UI-only fix
2. `docs/LOW_REASONING_DEV_PROTOCOL.md` - execution rules, stop conditions, completion report
3. `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md` - UI gates for accessibility
4. `docs/SLICE_MAP.md` - confirms Slice 3.9 status
5. `components/RevisionQueue.tsx` - current revision card implementation
6. `docs/UX_ARCHITECTURE.md` keyboard/focus rules - clickability patterns

Do not read:
- Pipeline files. This is UI-only.
- Database files. No schema changes.
- API routes. No backend changes.

---

## 1. Goal

Make revision queue cards clickable to start review. Users should be able to click anywhere on the card (not just a small button) to begin reviewing.

---

## 1.5. ⚠️ CONSTRAINT CARD (Check Before EVERY Edit)

**Allowed files (section 2)**:
- `components/RevisionQueue.tsx`
- `docs/SLICE_3_5_AUTH_SESSION_NOTES.md` (completion evidence only)

**Forbidden areas (section 3)**:
- API routes (no backend changes needed)
- Database files (no schema changes)
- Pipeline files (no learning logic changes)
- Other component files (only RevisionQueue)

**Expected git diff**:
```
M components/RevisionQueue.tsx
```

**Mandatory checks before committing**:
- [ ] Only RevisionQueue.tsx modified?
- [ ] Cards clickable with mouse?
- [ ] Cards activatable with keyboard (Enter/Space)?
- [ ] Hover state shows clickability?
- [ ] ARIA role="button" for accessibility?
- [ ] Typecheck passes?
- [ ] Build passes?

**Stop conditions**:
- RevisionQueue component structure radically changed
- Backend changes seem necessary
- Other components need modification

---

## 2. Allowed Scope

**Files:**
- `components/RevisionQueue.tsx` only

**Changes:**
- Make card container clickable (not just "Start Review" button)
- Add hover state to indicate clickability
- Add keyboard navigation (Enter/Space to start review)
- Add ARIA attributes for accessibility
- Optional: Add keyboard shortcut hint in UI

---

## 3. Explicit Non-Goals

- **No** spaced repetition algorithm changes
- **No** revision data model changes
- **No** API endpoint modifications
- **No** changes to review process itself (Again/Hard/Good/Easy buttons)
- **No** changes to other tabs or components
- **No** migration to new component structure

---

## 4. Current State Analysis

**User Report:** "In revision section the item is not clickable"

**Investigation needed:**
1. Read `components/RevisionQueue.tsx` to understand current structure
2. Check if cards have click handlers
3. Verify if only a small button is clickable vs. entire card
4. Test keyboard accessibility

**Expected findings:**
- Likely only "Start Review" button is clickable
- Card container probably not interactive
- May be missing hover states
- May be missing keyboard support

---

## 5. UX States

| State | Expected Behavior |
|---|---|
| Idle card | Card shows revision item with visual hint it's clickable (cursor: pointer) |
| Hover | Card background changes slightly to indicate interactivity |
| Focus | Card has visible focus ring when navigated via keyboard |
| Click/Enter | Starts review for that card (same as current "Start Review" button) |
| No cards | Empty state unchanged (already implemented in Slice 3.8) |

---

## 6. Implementation Approach

### Option A: Make Entire Card Clickable (Recommended)
- Wrap card content in `<button>` element
- Style button to look like card
- Remove or integrate existing "Start Review" button
- Add proper ARIA labels

### Option B: Add Click Handler to Card Container
- Keep existing structure
- Add onClick to card div
- Add onKeyDown for keyboard
- Add role="button" and tabIndex={0}

**Recommendation:** Option A is more accessible and semantic.

---

## 7. Accessibility Requirements

- Card must be keyboard-focusable (tabIndex={0} or button element)
- Card must respond to Enter and Space keys
- Card must have appropriate ARIA role (role="button" if div, implicit if button element)
- Card must have accessible label (aria-label with card content summary)
- Focus indicator must be visible (CSS focus-visible)
- Hover state must not be the only clickability indicator (also cursor change)

---

## 8. Acceptance Criteria

- [ ] User can click anywhere on revision card to start review
- [ ] User can press Enter or Space on focused card to start review
- [ ] Hover state clearly indicates card is clickable
- [ ] Focus ring visible when navigating with keyboard (Tab key)
- [ ] Screen readers announce card as button with appropriate label
- [ ] Existing review flow (Again/Hard/Good/Easy) still works
- [ ] No console errors or warnings
- [ ] 375px mobile layout still works
- [ ] Dark mode styling correct

---

## 9. Validation

Run:
```bash
npm run typecheck
npm run build
```

Manual checks:
- [ ] Click card with mouse → review starts
- [ ] Tab to card, press Enter → review starts
- [ ] Tab to card, press Space → review starts
- [ ] Hover over card → visual feedback appears
- [ ] Review flow completes normally
- [ ] Test on 375px viewport
- [ ] Test in dark mode
- [ ] Test with screen reader (if available)

---

## 10. Stop Conditions

Stop and ask if:
- RevisionQueue component is structured completely differently than expected
- Backend API changes seem necessary
- Review flow logic needs modification
- Other components need to change
- Schema migration appears necessary

---

## 11. Completion Report Format

```markdown
Changed:
- `components/RevisionQueue.tsx`: [summary of changes]

Validation:
- `npm run typecheck`: pass/fail
- `npm run build`: pass/fail

Manual:
- Click card starts review: pass/fail
- Keyboard Enter starts review: pass/fail
- Keyboard Space starts review: pass/fail
- Hover state visible: pass/fail
- Focus ring visible: pass/fail
- 375px layout works: pass/fail
- Dark mode correct: pass/fail
```

---

## 12. Estimated Time

**30 minutes** (simple UI fix, single component)
