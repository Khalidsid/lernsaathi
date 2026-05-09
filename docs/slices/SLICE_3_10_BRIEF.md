# Slice 3.10 Brief: Production Gates And Framework Boundaries

**Status:** planned  
**Primary protocol:** `docs/LOW_REASONING_DEV_PROTOCOL.md`  
**Purpose:** Add framework-level loading/error boundaries and executable quality gates before new feature work.

---

## 1. Goal

Make the app safer for future development by adding route loading/error boundaries, a single verification script, and first automated smoke/accessibility gates.

---

## 2. Allowed Scope

- `app/loading.tsx`
- `app/error.tsx`
- `app/not-found.tsx`
- `app/chat/loading.tsx` if route-specific loading is needed
- `app/chat/error.tsx` if route-specific error recovery is needed
- `eslint.config.mjs`
- `package.json`
- test setup files if adding Playwright or axe
- `docs/ARCHITECTURE.md`
- `docs/SLICE_MAP.md`

---

## 3. Explicit Non-Goals

- Do not implement image upload.
- Do not redesign the chat UI.
- Do not change prompt behavior.
- Do not change database schema.
- Do not refactor all client/server component boundaries in one pass.
- Do not add visual regression tooling unless Playwright/a11y basics are already done.

---

## 4. Required Reads

- `docs/LOW_REASONING_DEV_PROTOCOL.md`
- `docs/RETROSPECTIVE_ARCHITECTURAL_ANALYSIS.md` sections 2, 5, 6, 11, 12
- `docs/UX_ARCHITECTURE.md`
- `docs/COMPONENT_CONTRACTS.md`
- `app/layout.tsx`
- `components/AppShell.tsx`
- `components/ChatShell.tsx`
- `eslint.config.mjs`
- `package.json`

---

## 5. UX States

| State | Expected Behavior |
|---|---|
| Happy path | Existing app behavior remains unchanged. |
| Loading | Route loading UI appears during route transitions or suspense. |
| Empty | Existing tab empty states remain unchanged. |
| Error | Route error UI gives retry/reload path. |
| Disabled | Not applicable unless a retry button is temporarily disabled. |
| Success | Build and smoke test gates pass. |

---

## 6. API/Data Contract

- Routes touched: none unless error boundaries require links.
- Request schema: unchanged.
- Response schema: unchanged.
- Database models touched: none.
- Idempotency behavior: unchanged.
- Rate limit behavior: unchanged.
- Logging behavior: unchanged.

---

## 7. Accessibility And Mobile

- Error page retry button must be keyboard reachable.
- Loading UI must not create layout shift.
- Error UI must work at 375px width.
- Icons must be decorative or labeled.
- Reduced motion should be respected if animation is used.

---

## 8. Implementation Steps

1. Add root `loading.tsx` using existing visual tokens.
2. Add root `error.tsx` as a client component with retry and home/chat link.
3. Add `not-found.tsx` if a generic route fallback is useful.
4. Add `verify` script to `package.json`.
5. Configure already-installed ESLint plugins where safe.
6. Add minimal Playwright setup only if dependency/install constraints are resolved.
7. Add minimal axe smoke test only after Playwright is working.
8. Document any tooling not installed because it requires network/package approval.

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

Run `npm run verify` after it exists.

---

## 10. Stop Conditions

Stop if:

- Adding Playwright or axe requires network install and approval is not available.
- ESLint plugin configuration creates many unrelated existing failures.
- Error boundary changes require broad UI redesign.
- Unexpected worktree changes affect app shell or route files.

---

## 11. Completion Evidence

- Commands run:
- Tooling added:
- Tooling deferred:
- Known limitations:
- `docs/SLICE_MAP.md` status update:

