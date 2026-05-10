# Route Boundaries: Why They Matter

**Source:** Extracted from `RETROSPECTIVE_ARCHITECTURAL_ANALYSIS.md` section 6
**Purpose:** Explains App Router loading/error boundary conventions for Slice 3.10
**Context:** Next.js App Router provides framework-level reliability patterns

---

## Objective

Make the app use framework-level reliability conventions and make quality checks executable.

---

## Why Route Boundaries Are P0

**Problem:** Currently the app has:
- No `app/**/loading.tsx` exists → No route-level loading feedback
- No `app/**/error.tsx` or `app/global-error.tsx` → Uncaught errors have no controlled recovery UI

**Impact:**
- Users see blank screens during route transitions
- Errors crash the entire page with no recovery path
- Mobile users with slow connections have no feedback

**Framework Solution:** App Router boundaries are the standard pattern:
- `loading.tsx` shows automatic fallback UI during Suspense/async boundaries
- `error.tsx` catches errors and provides retry/recovery actions
- `not-found.tsx` handles missing route cases

---

## Required Implementation

### 1. Add Route Loading Boundaries

```text
app/loading.tsx
app/(auth)/login/loading.tsx (if login needs distinct treatment)
app/chat/loading.tsx (if chat route has route-specific skeleton)
```

### 2. Add Route Error Boundaries

```text
app/error.tsx
app/global-error.tsx (if needed)
app/chat/error.tsx (for chat-specific recovery)
```

### 3. Add Not-Found Handling

```text
app/not-found.tsx
```

---

## Additional Reliability Gates

### 4. Configure ESLint

Enable installed plugins:
- `eslint-plugin-jsx-a11y`
- `eslint-plugin-react-hooks`
- `eslint-plugin-import`

### 5. Add Verification Script

```json
{
  "scripts": {
    "verify": "npm run typecheck && npm run lint && npm run test:unit && npm run check:policy && npm run build"
  }
}
```

### 6. Add Playwright Smoke Tests

```text
tests/e2e/login.spec.ts
tests/e2e/chat.spec.ts
tests/e2e/revision.spec.ts
```

### 7. Add Accessibility Automation

```text
@axe-core/playwright
tests/a11y/core-flows.spec.ts
```

### 8. Audit Client Boundaries

- Keep `"use client"` where state, effects, browser APIs, or event handlers are needed
- Move purely presentational components back to server-compatible
- Do not import server-only modules into client files
- Document audit findings in `docs/ARCHITECTURE.md`

---

## Exit Criteria

- `npm run verify` passes
- Route loading and route error UIs exist
- At least one Playwright smoke test covers login and chat
- At least one axe scan covers the authenticated shell
- Client-boundary audit note added to `docs/ARCHITECTURE.md`
