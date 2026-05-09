# Slice 3.11 Brief: UX Architecture And Accessibility Baseline

**Status:** planned  
**Primary protocol:** `docs/LOW_REASONING_DEV_PROTOCOL.md`  
**Purpose:** Convert UI/design decisions into explicit contracts that a lower-reasoning model can follow.

---

## 1. Goal

Refine the UI governance docs and fix the highest-risk accessibility issues in current interactive surfaces.

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

