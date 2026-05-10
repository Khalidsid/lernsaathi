# Slice 3.11 Brief: UX Architecture And Accessibility Baseline

**Status:** planned  
**Primary protocol:** `docs/LOW_REASONING_DEV_PROTOCOL.md`  
**Purpose:** Convert UI/design decisions into explicit contracts that a lower-reasoning model can follow.

---

## 0. Context Navigation

Read in this order:

1. `docs/DOC_NAVIGATION.md` - prevents broad context loading.
2. `docs/LOW_REASONING_DEV_PROTOCOL.md` - execution rules and stop conditions.
3. `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md` - fake-control, accessibility, drift, and evidence gates.
4. `docs/SLICE_MAP.md` - confirms Slice 3.11 status and blockers.
5. `docs/UX_ARCHITECTURE.md` - primary source for layout, states, mobile, accessibility, and auth visibility rules.
6. `docs/COMPONENT_CONTRACTS.md` - component ownership and non-goals.
7. `docs/NAMING.md` - state, callback, API, and test naming rules.
8. `docs/VISUAL_INTEGRATION_NOTES.md` and `docs/UI_PATCH_NOTES.md` - read only to preserve established shell visual behavior.
9. `components/RevisionCard.tsx`, `components/AppShell.tsx`, `components/NamePromptModal.tsx`, `components/LearningStatePanel.tsx` - current high-risk interactive surfaces.

Do not read:

- `docs/RETROSPECTIVE_ARCHITECTURAL_ANALYSIS.md` in full unless a P0 rule is unclear.
- Prompt docs unless UI work unexpectedly changes prompt/model behavior.

---

## 1. Goal

Refine the UI governance docs and fix the highest-risk accessibility issues in current interactive surfaces.

---

## 1.5. ⚠️ CONSTRAINT CARD (Check Before EVERY Edit)

**Allowed files (section 2)**:
- `docs/UX_ARCHITECTURE.md`
- `docs/COMPONENT_CONTRACTS.md`
- `docs/NAMING.md`
- `components/RevisionCard.tsx`
- `components/AppShell.tsx`
- `components/NamePromptModal.tsx`
- `components/LearningStatePanel.tsx`
- `app/layout.tsx`
- `app/globals.css`
- focused tests if test tooling exists
- `docs/SLICE_MAP.md`

**Forbidden areas (section 3)**:
- Product visual identity redesign
- Image upload implementation
- New learning features (STOP if feature scope expands)
- Broad component renaming
- Refactor all components for perfect accessibility in one pass

**Expected git diff**:
```
M docs/UX_ARCHITECTURE.md
M docs/COMPONENT_CONTRACTS.md
M docs/NAMING.md
M components/RevisionCard.tsx
M components/AppShell.tsx (if menu a11y improved)
M components/NamePromptModal.tsx (if modal a11y improved)
M components/LearningStatePanel.tsx
M app/layout.tsx (if skip-to-content added)
M app/globals.css (if skip-to-content styles added)
M docs/SLICE_MAP.md
```

**Mandatory checks before committing**:
- [ ] Only allowed files modified?
- [ ] Text-entry guard added to `RevisionCard` keyboard shortcuts?
- [ ] Skip-to-content link added if feasible?
- [ ] `LearningStatePanel` accessibility labels/live regions improved where safe?
- [ ] Keyboard checks pass: open/close menu?
- [ ] Keyboard checks pass: name prompt save/skip?
- [ ] Keyboard checks pass: revision reveal/rate?
- [ ] 375px mobile layout checked for touched components?
- [ ] Existing visual behavior preserved (no regression)?
- [ ] Intentionally deferred accessibility work documented in updated docs?

**Stop conditions (section 10)**:
- Focus trap requires dependency not already available
- Skip link requires broad layout restructuring
- Keyboard fixes cause behavior conflicts outside touched components
- Manual keyboard behavior cannot be checked

---

## 2. Allowed Scope

- `docs/UX_ARCHITECTURE.md`
- `docs/COMPONENT_CONTRACTS.md`
- `docs/NAMING.md`
- `components/RevisionCard.tsx`
- `components/AppShell.tsx`
- `components/NamePromptModal.tsx`
- `components/LearningStatePanel.tsx`
- `app/layout.tsx`
- `app/globals.css`
- focused tests if test tooling exists
- `docs/SLICE_MAP.md`

---

## 3. Explicit Non-Goals

- Do not redesign the product visual identity.
- Do not implement image upload.
- Do not add new learning features.
- Do not broadly rename components.
- Do not refactor all components for perfect accessibility in one pass.

---

## 4. Required Reads

- `docs/LOW_REASONING_DEV_PROTOCOL.md`
- `docs/UX_ARCHITECTURE.md`
- `docs/COMPONENT_CONTRACTS.md`
- `docs/NAMING.md`
- `docs/VISUAL_INTEGRATION_NOTES.md`
- `docs/UI_PATCH_NOTES.md`
- `components/RevisionCard.tsx`
- `components/AppShell.tsx`
- `components/NamePromptModal.tsx`
- `components/LearningStatePanel.tsx`

---

## 5. UX States

| State | Expected Behavior |
|---|---|
| Happy path | Current chat/revision/menu/name prompt behavior remains intact. |
| Loading | Learning state skeleton remains visible and accessible. |
| Empty | Existing empty states remain, with no fake controls. |
| Error | Inline retry exists where data fetch can fail. |
| Disabled | Pending form/button states remain clear. |
| Success | Focus and keyboard behavior improve without visual regression. |

---

## 6. API/Data Contract

- Routes touched: none unless accessibility fix needs no new API.
- Request schema: unchanged.
- Response schema: unchanged.
- Database models touched: none.
- Idempotency behavior: unchanged.
- Rate limit behavior: unchanged.
- Logging behavior: unchanged.

---

## 7. Accessibility And Mobile

Required fixes:

- Add global skip-to-content target if feasible.
- Add text-entry guard to `RevisionCard` keyboard shortcuts.
- Ensure menu Escape close and outside click remain intact.
- Add or document focus return for menu/name modal.
- Add `aria-live` plan or implementation for learning state count changes.
- Check 375px layout for touched components.

---

## 8. Implementation Steps

1. Refine docs so each UI rule is explicit and low-judgment.
2. Add shared keyboard text-entry guard if only one or two files need it.
3. Apply guard to `RevisionCard`.
4. Add skip-to-content link and target if it does not disrupt layout.
5. Improve `LearningStatePanel` accessibility labels/live regions where safe.
6. Update docs with any intentionally deferred accessibility work.

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

Also perform manual keyboard check for:

- Open/close menu.
- Name prompt save/skip.
- Revision reveal/rate.

---

## 10. Stop Conditions

Stop if:

- Focus trap implementation requires a dependency not already available.
- Adding skip link requires broad layout restructuring.
- Keyboard fixes cause behavior conflicts outside touched components.
- Manual keyboard behavior cannot be checked.

---

## 11. Completion Evidence

- Commands run:
- Keyboard checks:
- Mobile checks:
- Known limitations:
- `docs/SLICE_MAP.md` status update:
