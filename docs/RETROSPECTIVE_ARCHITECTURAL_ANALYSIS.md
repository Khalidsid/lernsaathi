# Retrospective Architectural Analysis and Realignment Plan

**Date:** 2026-05-09  
**Status:** Active governance document for all slices after Slice 3.9  
**Scope:** Architecture, UX, reliability, safety, privacy, testing, low-reasoning execution, and LLM-assisted development process  
**Decision:** Do not start Slice 4 image input until the P0 realignment gates in this file are implemented or explicitly waived.

**Important framing:** This is an introspective control document. It explains why the process changed. It is not the file that every future coding session should fully load. Future implementation sessions should use the smaller execution docs listed below so a lower-reasoning model can complete tasks successfully with less context and fewer errors.

Primary execution docs:

- `docs/LOW_REASONING_DEV_PROTOCOL.md`
- `docs/UX_ARCHITECTURE.md`
- `docs/COMPONENT_CONTRACTS.md`
- `docs/NAMING.md`
- `docs/slices/SLICE_TEMPLATE.md`
- The active `docs/slices/SLICE_*_BRIEF.md`

---

## 1. Executive Decision

The project has reached functional completeness through Slice 3.9, but the development process is not yet production-grade. The main problem is not that individual features are broken. The problem is that quality has been discovered retroactively instead of being designed, implemented, and verified as part of every slice.

This file converts the earlier retrospective into a realignment plan. The operating model is now split into smaller docs so future lower-reasoning sessions do not need to carry the entire retrospective in context.

### Core Finding

The current slice process optimizes for visible feature progress, but it does not reliably enforce:

- UX architecture before UI implementation.
- Framework conventions before custom patterns.
- Error, loading, empty, and offline behavior before happy-path behavior.
- Accessibility, mobile, and keyboard behavior as merge gates.
- Production reliability controls such as distributed rate limiting and observability.
- AI safety, eval, and model-change discipline.
- Privacy and retention rules for learner data.

### Required Shift

Future slices must move from:

```text
Prompt -> implement -> typecheck -> document -> mark complete
```

to:

```text
Design brief -> contracts -> risk review -> implementation -> automated gates -> manual evidence -> debt register -> slice close
```

If a slice changes user-facing UI, API behavior, database shape, prompt behavior, or learner memory, it must define its quality gates before implementation starts.

### Lower-Reasoning Agent Success Criteria

Future docs and prompts must be written so a lower-reasoning model can complete the task without reconstructing the entire architecture.

That means each future task must provide:

- Exact files allowed to change.
- Exact files not to touch.
- Required reads limited to the task.
- Numbered implementation steps.
- Observable acceptance criteria.
- Validation commands.
- Stop conditions.
- Completion report format.

Do not ask future agents to "use judgment" where a rule can be written. If a tradeoff is required, state the tradeoff explicitly.

---

## 2. Evidence From Current Repository

This section validates the retrospective against the current codebase. It separates confirmed facts from architectural interpretation.

| Area | Evidence | Impact |
|---|---|---|
| Route loading boundaries | No `app/**/loading.tsx` exists. | The app does not use the App Router convention for route-level loading feedback. |
| Route error boundaries | No `app/**/error.tsx` or `app/global-error.tsx` exists. | Uncaught route errors do not have a controlled recovery UI. |
| Observability | No root `instrumentation.ts` exists. | No first-class startup instrumentation, tracing, or production monitoring hook. |
| Client boundary discipline | Many UI files begin with `"use client"`, including shell and list surfaces. | Some client usage is necessary, but the current boundary should be audited to avoid unnecessary browser JS. |
| Loading inconsistency | `MessageList` uses `Thinking...`; `LearningStatePanel` uses shimmer; chat errors use generic assistant messages. | Learners see inconsistent system behavior and unclear recovery paths. |
| Error handling | API routes often cast `await request.json()` directly and return string errors. | Malformed JSON, schema mismatch, and retryable failures are not classified consistently. |
| Rate limiting | `lib/ratelimit.ts` uses an in-memory `Map`. | It does not work correctly across multiple server instances or cold starts. |
| Accessibility gates | `eslint-plugin-jsx-a11y` is installed but not wired into `eslint.config.mjs`. | Accessibility defects can merge without automated detection. |
| Keyboard shortcuts | `RevisionCard` listens on `window` for `keydown` without a general active-input guard. | Shortcuts can conflict with typing and future interactive components. |
| Learning state accuracy | `learning-state` counts `LearningEvent.inputType = "revision_attempt"`, but revision review does not write that event. | "Done today" can be inaccurate, undermining learner trust. |
| Privacy and retention | `LearningEvent` stores `rawInput`, `attemptText`, `response`, and `structured` with no visible retention policy. | Learner data governance is incomplete. |
| AI eval scope | `npm run eval` exists, but it is live-model smoke testing over a small golden set. | Useful, but insufficient for continuous reliability and prompt regression management. |
| Manual evidence | Slice docs repeatedly say manual browser/mobile/dark-mode/accessibility testing is recommended or pending. | "Complete" currently means local build success, not production readiness. |

---

## 3. External Standards Validation

The retrospective's direction is supported by current platform and production guidance.

### Next.js App Router

Next.js provides file-system conventions for `loading.tsx` and `error.tsx`. The app is not using them yet. These conventions are not optional polish; they are the framework's built-in way to handle streaming loading UI and route failure recovery.

Relevant guidance:

- Loading UI: https://nextjs.org/docs/app/api-reference/file-conventions/loading
- Error handling: https://nextjs.org/docs/app/getting-started/error-handling
- Server and Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components
- Instrumentation: https://nextjs.org/docs/app/guides/instrumentation

### Accessibility

WCAG 2.2 is the appropriate current target. WCAG conformance is based on testable success criteria, not intent. The app should target WCAG 2.2 AA for the core learner flows.

Relevant guidance:

- W3C WCAG overview: https://www.w3.org/WAI/standards-guidelines/wcag/

### Performance

Production UX should include explicit Core Web Vitals targets:

- LCP: `<= 2.5s`
- INP: `<= 200ms`
- CLS: `<= 0.1`

Relevant guidance:

- Web Vitals: https://web.dev/articles/vitals

### Security and Secure Development

The project has authentication and allowlisting, but the slice process does not yet include a secure design review. OWASP and NIST both support adding secure design, access control review, dependency hygiene, logging, and vulnerability prevention to the development lifecycle.

Relevant guidance:

- OWASP Top 10: https://owasp.org/Top10/2021/
- NIST SSDF: https://csrc.nist.gov/pubs/sp/800/218/final

### AI Product Reliability and Safety

Structured Outputs are a strength in this project, but they are only one part of AI production readiness. The app needs stronger eval coverage, safety identifiers, model-change policy, adversarial testing, and user issue reporting.

Relevant guidance:

- OpenAI Structured Outputs: https://developers.openai.com/api/docs/guides/structured-outputs
- OpenAI evaluation best practices: https://developers.openai.com/api/docs/guides/evaluation-best-practices
- OpenAI safety best practices: https://developers.openai.com/api/docs/guides/safety-best-practices
- OpenAI safety checks: https://developers.openai.com/api/docs/guides/safety-checks

---

## 4. Critical Shortcomings in Ongoing Development

### 4.1 "Complete Locally" Is Not a Production Quality State

Several slice notes mark work as complete while still listing manual browser testing, mobile validation, dark mode validation, keyboard testing, or production evidence as pending.

This is the highest process risk because it allows quality debt to become normalized.

New rule:

- A slice can be "implemented locally" without manual evidence.
- A slice cannot be "complete" unless its defined gates pass or the missing evidence is logged as an explicit release blocker.

### 4.2 UX Is Being Retrofitted After Implementation

The chat viewport, menu behavior, theme controls, progress visibility, keyboard shortcuts, and bilingual UI strategy were all corrected after implementation pressure revealed problems.

This pattern creates rework and inconsistent components.

New rule:

- Any user-facing slice must start with a one-page UX brief covering happy path, loading path, empty path, error path, mobile behavior, keyboard behavior, and accessibility requirements.

### 4.3 Framework Conventions Are Underused

The app uses Next.js App Router, but it does not yet use key route conventions:

- `loading.tsx`
- `error.tsx`
- `not-found.tsx` where applicable
- root `instrumentation.ts`
- narrow server/client component boundaries

New rule:

- Prefer framework conventions over custom component-level patches unless there is a documented reason not to.

### 4.4 Error Handling Is Message-Based, Not Policy-Based

Current errors are mostly text strings such as:

- "Couldn't get a response right now."
- "Couldn't save right now. Please try again in a moment."
- "Failed to load learning state."

These are not enough for production because they do not distinguish:

- User input validation.
- Auth/session expiration.
- Rate limits.
- OpenAI safety or quota blocks.
- Network failure.
- Database conflict.
- Retryable versus non-retryable failure.
- Recoverable UI state versus page-level failure.

New rule:

- Every API route must return a consistent error envelope with a code, message, retryability flag, and request id.

### 4.5 Reliability Is Still Local-Instance Oriented

The current rate limiter uses memory. That is acceptable for a prototype, but not for production when deployments can have multiple instances or cold starts.

New rule:

- Any user-facing request limit, idempotency guarantee, or abuse control must work across deployed instances.

### 4.6 Learner Data Governance Is Missing

The app stores user inputs, attempts, generated responses, structured model outputs, and mistake memory. This is core product value, but also privacy-sensitive.

Missing decisions:

- Retention window.
- Export path.
- Delete path.
- Redaction policy for logs.
- Whether raw learner input can be used in evals.
- Whether production data can be viewed in admin screens.
- Whether prompt and response records should be encrypted or selectively minimized.

New rule:

- No new memory feature should ship without a retention and deletion decision.

### 4.7 AI Reliability Is Not Yet a Full Product Discipline

The project has strong prompt-file discipline and strict JSON schemas. That is good. The gap is that evals are still too narrow and not fully integrated as gates.

Missing decisions:

- Model alias versus pinned snapshot policy.
- Prompt-change gate.
- Larger eval coverage for grammar, correction, attempts, out-of-scope, safety, and adversarial prompts.
- Human review loop for severe pedagogical failures.
- Safety identifier usage.
- Handling OpenAI safety blocks and delayed responses.
- Cost and latency budgets per user turn.

New rule:

- Any prompt or model change must run an eval suite and document expected behavior changes.

### 4.8 Accessibility Is Treated as an Audit, Not a Build Constraint

The current app has some focus styles, ARIA labels, reduced-motion CSS, and keyboard shortcuts. That is not the same as WCAG 2.2 AA readiness.

Missing controls:

- Automated axe checks.
- Keyboard-only journey tests.
- Focus trap for modal/menu patterns.
- Focus restoration after closing overlays.
- `aria-live` for dynamic learning state and chat updates.
- Touch target audit.
- Screen reader smoke tests.

New rule:

- Accessibility is a slice-entry and slice-exit constraint, not a post-release cleanup item.

### 4.9 Mobile Behavior Is Not a First-Class Design Input

The app is visually mobile-shaped, but mobile behavior is broader than a narrow viewport.

Missing checks:

- On-screen keyboard behavior.
- Safe area behavior.
- Touch target size.
- Scroll containment.
- iOS Safari quirks.
- Android Chrome low-end performance.
- Reduced motion and low-power mode.

New rule:

- Every UI slice must define and test at least one 375px mobile viewport and one desktop viewport.

---

## 5. Realignment Roadmap Before Slice 4

Slice 4 image input should not begin until the project has a stronger foundation. Image input adds file handling, vision model calls, larger payloads, privacy risk, safety risk, upload failures, and mobile capture edge cases. Starting it before realignment will multiply existing debt.

### New Intermediate Slices

| Slice | Name | Purpose | Blocks Slice 4? |
|---|---|---|---|
| 3.10 | Production Gates and Framework Boundaries | Add route loading/error boundaries, CI quality gates, lint rules, and server/client audit. | Yes |
| 3.11 | UX Architecture and Accessibility Baseline | Create UX architecture, component contracts, keyboard/focus model, and WCAG baseline tests. | Yes |
| 3.12 | Reliability, Safety, and Privacy Baseline | Add distributed rate limiting plan, API validation, observability, AI safety identifiers, and data-retention policy. | Yes |
| 3.13 | Evidence Pass and Debt Triage | Browser/mobile/manual evidence, fix inaccurate learning state, prioritize remaining debt. | Yes |
| 4.0 | Image Input | Start only after 3.10-3.13 gates pass or are explicitly waived. | N/A |

---

## 6. Slice 3.10: Production Gates and Framework Boundaries

### Objective

Make the app use framework-level reliability conventions and make quality checks executable.

### Required Implementation

1. Add route loading boundaries:

```text
app/loading.tsx
app/(auth)/login/loading.tsx if login needs distinct treatment
app/chat/loading.tsx if chat route has route-specific skeleton
```

2. Add route error boundaries:

```text
app/error.tsx
app/global-error.tsx if needed
app/chat/error.tsx for chat-specific recovery
```

3. Add not-found handling where relevant:

```text
app/not-found.tsx
```

4. Configure ESLint for installed plugins:

```text
eslint-plugin-jsx-a11y
eslint-plugin-react-hooks
eslint-plugin-import
```

5. Add CI-equivalent local script:

```json
{
  "scripts": {
    "verify": "npm run typecheck && npm run lint && npm run test:unit && npm run check:policy && npm run build"
  }
}
```

6. Add Playwright smoke test setup:

```text
tests/e2e/login.spec.ts
tests/e2e/chat.spec.ts
tests/e2e/revision.spec.ts
```

7. Add accessibility automation:

```text
@axe-core/playwright
tests/a11y/core-flows.spec.ts
```

8. Audit `"use client"` boundaries:

- Keep client components where state, effects, browser APIs, or event handlers are needed.
- Move purely presentational components back to server-compatible components.
- Do not import server-only modules into client files.

### Exit Criteria

- `npm run verify` passes.
- Route loading and route error UIs exist.
- At least one Playwright smoke test covers login and chat.
- At least one axe scan covers the authenticated shell.
- A client-boundary audit note is added to `docs/ARCHITECTURE.md`.

---

## 7. Slice 3.11: UX Architecture and Accessibility Baseline

### Objective

Stop retrofitting interaction decisions after implementation.

### Required Documents

Use and refine `docs/UX_ARCHITECTURE.md` with:

- Product voice rules.
- Layout invariants.
- Chat shell invariants.
- Loading, error, empty, success, and disabled-state taxonomy.
- Modal, menu, and popover rules.
- Keyboard shortcut policy.
- Focus management policy.
- Mobile viewport policy.
- Motion design policy.
- Accessibility target: WCAG 2.2 AA for core flows.

Use and refine `docs/COMPONENT_CONTRACTS.md` with:

- Button contract.
- Text input contract.
- Composer contract.
- Modal contract.
- Menu contract.
- Toast/alert contract.
- Card contract.
- Skeleton contract.
- Empty state contract.

Use and refine `docs/NAMING.md` with:

- Boolean state naming.
- Event prop naming.
- API route naming.
- Error code naming.
- Test naming.
- Prompt and schema naming.

### Accessibility Implementation

1. Add skip-to-content link in the root layout or app shell.
2. Add `aria-live` strategy for:

- Chat pending and assistant response arrival.
- Learning state counts.
- Revision save feedback.
- Toasts and alerts.

3. Add focus management for:

- Name prompt modal.
- Overflow menu.
- Route error recovery.
- Revision reveal/rating controls.

4. Add keyboard conflict guard:

```ts
function isTextEntryTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}
```

Revision shortcuts must not fire while the user is typing.

5. Add target-size audit:

- WCAG 2.2 AA minimum target size is lower than many mobile design recommendations.
- Use `44px x 44px` as product target for primary mobile actions unless a documented exception exists.

### Exit Criteria

- UX architecture doc exists and is referenced by `docs/SLICE_MAP.md`.
- All interactive overlay components have focus behavior documented.
- At least one keyboard-only test exists for chat and revision.
- At least one mobile viewport test exists at 375px width.

---

## 8. Slice 3.12: Reliability, Safety, and Privacy Baseline

### Objective

Move from prototype reliability to production-aware reliability.

### API Validation

Add request validation for all API routes. Use `zod`, which is already present in dependencies.

Suggested constraints:

| Route | Field | Constraint |
|---|---|---|
| `/api/chat` | `input` | required string, trim, max 2000 chars |
| `/api/chat/attempt` | `attemptText` | required string, trim, max 2000 chars |
| `/api/chat/attempt` | `parentEventId` | cuid-like string |
| `/api/chat/attempt` | `kind` | enum `reflection`, `chhota_check` |
| `/api/profile` | `displayName` | optional string, max 60 chars |
| `/api/revision/review` | `itemId` | cuid-like string |
| `/api/revision/review` | `rating` | enum `again`, `hard`, `good`, `easy` |
| all mutating routes | `x-idempotency-key` | optional string, max 128 chars |

Malformed JSON must return a controlled `400`, not an uncaught exception.

### Error Envelope

All API routes should return:

```ts
type ApiErrorResponse = {
  ok: false;
  code:
    | "bad_request"
    | "unauthorized"
    | "forbidden"
    | "not_found"
    | "rate_limited"
    | "idempotency_conflict"
    | "daily_limit_reached"
    | "upstream_unavailable"
    | "validation_failed"
    | "internal_error";
  message: string;
  retryable: boolean;
  requestId: string;
};
```

Successful responses should either stay backward compatible or move to:

```ts
type ApiSuccessResponse<T> = {
  ok: true;
  data: T;
  requestId: string;
};
```

Choose one model and document it before changing client code.

### Distributed Rate Limiting

Replace the in-memory `Map` before multi-instance production.

Acceptable options:

- Redis or Upstash token bucket.
- Database-backed fixed window for low-traffic single-user deployments.
- Platform-native rate limit if deployment platform provides it.

Minimum dimensions:

- `userId`
- route
- IP or forwarded IP
- time window
- reset timestamp

Return these headers when practical:

```text
RateLimit-Limit
RateLimit-Remaining
RateLimit-Reset
Retry-After
```

### Observability

Add root `instrumentation.ts` and structured request logging.

Minimum fields:

- `requestId`
- route
- method
- status
- latency
- user id hash, not raw user id where avoidable
- model
- token counts
- OpenAI latency
- error code

Do not log:

- Raw learner input by default.
- Full model output by default.
- Passwords, hashes, auth tokens, idempotency keys.
- Email addresses unless explicitly redacted or hashed.

Current `inputPreview` logging should be revisited and either removed, hashed, or controlled by a safe debug flag.

### Privacy and Retention

Create `docs/DATA_GOVERNANCE.md`.

Required decisions:

- How long to retain `LearningEvent.rawInput`.
- How long to retain `LearningEvent.attemptText`.
- How long to retain model responses.
- Whether to allow export.
- Whether to allow full account deletion.
- Whether prompt/eval work can use production examples.
- Whether admin/stats should be renamed or role-gated.
- Whether deletion should cascade to mistakes, revision items, exam maps, and idempotency records.

Minimum implementation before broader use:

- Document retention.
- Add a deletion procedure, even if manual.
- Add an export procedure, even if manual.
- Add idempotency cleanup strategy.

### AI Safety and Model Governance

Add:

- `safety_identifier` on OpenAI requests using a stable privacy-preserving hash.
- Model policy document: alias versus pinned snapshot, upgrade process, rollback process.
- Safety/adversarial eval cases.
- User-visible limitation text.
- User issue-reporting path.
- Handling for OpenAI safety blocks and upstream errors.

Suggested policy:

- Development may use a model alias.
- Production should either pin a snapshot or treat alias movement as a release event.
- Any model change requires eval comparison and manual review of representative examples.

### Exit Criteria

- API request validation exists for all current mutating routes.
- Error envelope is documented and implemented on at least `/api/chat`, `/api/chat/attempt`, and `/api/revision/review`.
- Rate limiting no longer depends only on in-memory state, or a deployment waiver documents why single-instance is guaranteed.
- `docs/DATA_GOVERNANCE.md` exists.
- OpenAI requests include a privacy-preserving safety identifier or a documented reason not to.

---

## 9. Slice 3.13: Evidence Pass and Debt Triage

### Objective

Close the gap between local implementation and release confidence.

### Required Validation Matrix

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

### Required Fixes During Evidence Pass

1. Fix inaccurate `todayReviews` logic.

Current issue:

- `/api/learning-state` counts `LearningEvent` rows with `inputType = "revision_attempt"`.
- `/api/revision/review` updates revision state but does not create a `LearningEvent`.

Fix options:

- Create a `LearningEvent` for every revision review.
- Or add a dedicated `RevisionReview` table.
- Or compute today's review count from `Mistake.lastReviewedAt`, with known limitations.

Recommended:

- Add a dedicated `RevisionReview` table if product analytics will matter.
- For fast repair, write a `LearningEvent` inside `reviewRevisionItem` transaction or route handler.

2. Wire `Toast` or remove it.

Current issue:

- `components/Toast.tsx` exists but is not integrated into core save/review flows.

Decision:

- Either integrate it into revision save, learning state refresh, and profile save flows, or remove it until needed.

3. Resolve keyboard shortcut conflicts.

4. Confirm modal/menu focus behavior.

5. Record screenshots or short clips for dark/light/mobile states.

### Exit Criteria

- Evidence file exists at `docs/RELEASE_EVIDENCE_SLICE_3_13.md`.
- All P0 manual checks are passed or documented as release blockers.
- Technical debt register is updated.
- `docs/SLICE_MAP.md` reflects the new slice status vocabulary:
  - planned
  - implemented locally
  - verified locally
  - production smoke passed
  - complete

---

## 10. New Slice Implementation Model

Every future slice must follow this lifecycle.

### Phase 0: Slice Entry Gate

Before implementation:

- Is this slice blocked by any P0 debt?
- Does it touch UI, API, DB, prompts, auth, privacy, or learner memory?
- Are required source docs identified?
- Are non-goals explicit?
- Is rollback possible?

If a P0 item blocks the slice, fix the P0 item first.

### Phase 1: One-Page Slice Brief

Required file:

```text
docs/slices/SLICE_N_BRIEF.md
```

Required sections:

- User problem.
- Product outcome.
- User flow.
- Non-goals.
- Data touched.
- API touched.
- Prompt/model touched.
- UX states.
- Accessibility requirements.
- Mobile requirements.
- Security/privacy risks.
- Test plan.
- Release gates.

### Phase 2: Architecture Impact Review

Required if the slice changes:

- Database schema.
- API contract.
- Auth/session behavior.
- OpenAI prompt or model usage.
- Background jobs.
- File upload or storage.
- Rate limits.
- Logging.
- Learner memory.

Output:

```text
docs/adr/ADR-XXXX-[short-name].md
```

Only write ADRs for decisions that are hard to reverse or likely to be questioned later.

### Phase 3: UX Design Brief

Required for all user-facing slices.

Must cover:

- Happy path.
- Empty state.
- Loading state.
- Error state.
- Disabled state.
- Success feedback.
- Mobile layout.
- Keyboard path.
- Focus path.
- Screen reader behavior.
- Reduced motion behavior.

No UI implementation should start until these states are defined.

### Phase 4: Contract and Test Plan

Before coding:

- Define request and response schemas.
- Define DB migration expectations.
- Define prompt output schemas.
- Define expected eval cases.
- Define unit tests.
- Define e2e tests.
- Define manual evidence.

### Phase 5: Implementation

Implementation rules:

- Keep changes scoped to the slice.
- Do not create generic abstractions until a second real use case exists.
- Prefer framework conventions.
- Prefer server components unless browser interactivity is required.
- Do not add hidden data collection.
- Do not add TODOs without tracking them in the debt register.

### Phase 6: Verification

Required commands unless explicitly not relevant:

```bash
npm run typecheck
npm run lint
npm run test:unit
npm run check:policy
npm run eval
npm run build
```

Future required commands after tooling is added:

```bash
npm run test:e2e
npm run test:a11y
npm run verify
```

### Phase 7: Evidence and Closure

A slice is not complete until:

- Automated gates pass.
- Required manual evidence is captured.
- Known limitations are listed.
- Debt register is updated.
- `docs/SLICE_MAP.md` status is updated.

---

## 11. Definition of Done

### All Slices

- Typecheck passes.
- Lint passes.
- Unit tests pass where logic changed.
- Build passes.
- No unrelated files are changed.
- No TODOs without debt-register entry.
- Docs updated.
- Rollback or mitigation path exists.

### UI Slices

- Loading state exists.
- Empty state exists.
- Error state exists.
- Success or saved state exists.
- Disabled state is meaningful.
- Keyboard path tested.
- Focus states visible.
- Modal/menu focus behavior defined.
- Mobile 375px viewport checked.
- Dark and light themes checked.
- Reduced motion behavior checked.
- Axe scan passes for touched flow, or exceptions are documented.

### API Slices

- Request validation uses schema, not casts only.
- Malformed JSON returns controlled `400`.
- Auth and ownership checks exist.
- Rate limit behavior is documented.
- Idempotency behavior is documented where mutation can be retried.
- Error envelope is consistent.
- Logs avoid raw sensitive input.
- Tests cover valid request, invalid request, unauthorized, not found, and retry/conflict where relevant.

### Database Slices

- Migration exists.
- Backward compatibility is considered.
- Indexes match query patterns.
- Cascading delete behavior is decided.
- Retention implications are documented.
- Seed data remains valid.

### AI / Prompt Slices

- Prompt file changes are reviewed.
- Structured output schema changes are versioned.
- Eval cases are added or updated.
- Out-of-scope behavior is tested.
- Safety/adversarial cases are considered.
- Model and cost impact are documented.
- Any model change includes comparison evidence.

### Release Closure

- Production smoke test passes where deployment is involved.
- Known limitations are not hidden in slice notes.
- P0 debt is not carried forward without explicit waiver.

---

## 12. Technical Debt Register

This register supersedes vague "deferred" notes. Every item needs a priority and action.

Priority definitions:

- P0: Blocks Slice 4 or production readiness.
- P1: Should be fixed before broad user testing.
- P2: Valuable but not blocking.
- P3: Nice-to-have or likely never needed.

| Item | Priority | Evidence | Recommended Action |
|---|---|---|---|
| No route `loading.tsx` / `error.tsx` | P0 | App Router conventions absent. | Add in Slice 3.10. |
| In-memory rate limiting | P0 | `lib/ratelimit.ts` uses `Map`. | Replace with shared store or document single-instance waiver. |
| Missing API validation | P0 | Routes cast JSON bodies directly. | Add zod schemas and safe JSON parsing. |
| No privacy/retention policy | P0 | Learner raw input and responses stored indefinitely. | Create data governance doc and deletion/export procedure. |
| No automated a11y/e2e gates | P0 | Tooling not configured. | Add Playwright and axe checks. |
| Inaccurate `todayReviews` metric | P0 | Learning state counts events not written by revision route. | Write review event or add review table. |
| No OpenAI safety identifier | P1 | `responses.create` does not pass `safety_identifier`. | Add hashed user identifier. |
| No model upgrade policy | P1 | `OPENAI_MODEL = "gpt-5"` alias. | Define alias/snapshot strategy. |
| Missing observability hook | P1 | No `instrumentation.ts`. | Add Next instrumentation and request ids. |
| Keyboard shortcut conflict risk | P1 | Revision listens globally. | Add text-entry guard and tests. |
| Toast component not integrated | P2 | Component exists but not used. | Wire or remove. |
| Naming inconsistencies | P2 | Callback/state names vary. | Fix opportunistically, not as broad risky refactor. |
| Storybook/component docs | P2 | No component catalog. | Add after core gates. |
| Offline/PWA | P2 | Currently planned for Slice 11. | Limit offline to revision/cache unless chat offline is feasible. |
| Celebration animations/streaks | P3 | Product polish only. | Do not schedule until reliability is solid. |

---

## 13. LLM-Assisted Development Protocol

The previous process relied too much on the LLM choosing patterns implicitly. Future prompts must be constrained.

### Required Prompt Context

Every implementation prompt must include:

- Slice brief path.
- Relevant architecture docs.
- Files likely to change.
- Explicit non-goals.
- Required quality gates.
- Error/loading/accessibility requirements.
- Test expectations.
- Data privacy constraints.

### Prompt Template

```markdown
# Slice [N]: [Name]

## Context
- Product: Hinglish-mediated German learning companion.
- Current slice goal: [one paragraph]
- Relevant docs: [paths]
- Existing patterns to preserve: [list]

## Non-goals
- [what not to change]

## Requirements
- [functional requirements]
- [UX requirements]
- [API/data requirements]
- [accessibility requirements]
- [mobile requirements]
- [error/loading/empty requirements]

## Constraints
- Use framework conventions before custom patterns.
- Keep client components narrow.
- Validate API input with schema.
- Do not log raw learner input unless explicitly approved.
- Update tests and docs.

## Verification
- npm run typecheck
- npm run lint
- npm run test:unit
- npm run check:policy
- npm run eval if prompts changed
- npm run build
- e2e/a11y checks if UI changed
```

### LLM Failure Modes To Guard Against

- Building only the happy path.
- Creating inconsistent loading or error states.
- Adding browser-side state where server rendering is sufficient.
- Inventing naming conventions per file.
- Overusing animations as a substitute for product clarity.
- Treating a generated output schema as a full eval strategy.
- Hiding manual validation gaps in optimistic slice notes.
- Leaving security, privacy, and rate-limit behavior implicit.

---

## 14. ADR Backlog

Create ADRs only for decisions that shape future development.

Recommended ADRs:

1. Four-button spaced repetition model.
2. Smart bilingual strategy: English chrome, Hinglish learning content, German examples.
3. Chat shell fixed viewport model.
4. Data retention and learner memory policy.
5. OpenAI model alias versus pinned snapshot policy.
6. Distributed rate limiting strategy.
7. Image input storage and privacy model before Slice 4.
8. Offline scope: revision-only versus broader app offline behavior.
9. Admin/stats access model.
10. Error envelope and API response contract.

---

## 15. Slice 4 Entry Criteria

Slice 4 image input must not start until these are true or explicitly waived:

- Route-level loading and error boundaries exist.
- API validation pattern exists.
- Error envelope exists for current chat/revision routes.
- Distributed or deployment-appropriate rate limiting is decided.
- Data governance doc exists.
- OpenAI safety identifier decision is implemented or waived.
- Accessibility and e2e smoke tooling exists.
- Learning state count bug is fixed.
- UX architecture doc exists.
- Slice 4 brief exists and covers upload failure, file size, file type, image privacy, mobile capture, retry, deletion, and safety behavior.

Slice 4 must include additional gates:

- File type validation.
- File size validation.
- Upload timeout handling.
- Upload retry behavior.
- Image deletion/retention policy.
- Vision prompt eval cases.
- Harmful image/content handling.
- Mobile camera/upload testing.
- Storage access control.

---

## 16. What Not To Do

Do not spend the next week only writing documents. Documentation without gates will not change behavior.

Do not start broad naming refactors before P0 reliability and validation work. Naming cleanup is useful, but it is not the largest production risk.

Do not add image upload, writing prompts, speaking support, or PWA features until baseline quality gates exist.

Do not claim production readiness from `typecheck`, `lint`, and `build` alone.

Do not treat OpenAI structured output as a substitute for evals, safety handling, or product review.

Do not make offline chat appear possible unless LLM access is actually available offline. Offline should initially mean cached revision and clear network messaging.

---

## 17. Immediate Work Order

Execute in this order.

1. Slice 3.10:
   - Add route loading/error boundaries.
   - Add `verify` script.
   - Configure a11y/react-hooks lint rules.
   - Add first Playwright and axe smoke tests.

2. Slice 3.11:
   - Refine `UX_ARCHITECTURE.md`.
   - Refine `COMPONENT_CONTRACTS.md`.
   - Refine `NAMING.md`.
   - Add focus and keyboard shortcut fixes.

3. Slice 3.12:
   - Add zod validation and safe JSON handling.
   - Add error envelope.
   - Decide and implement rate limit strategy.
   - Add data governance doc.
   - Add OpenAI safety identifier.

4. Slice 3.13:
   - Fix learning state review count.
   - Run manual validation matrix.
   - Create release evidence doc.
   - Update debt register and slice map.

5. Slice 4:
   - Start image input only after the above slices reach their required status or are explicitly waived.

---

## 18. Final Assessment

The original retrospective correctly identified architectural drift and LLM-driven inconsistency. The main correction is that the proposed response was too documentation-heavy. The project needs documents, but only as part of an executable quality system.

The right realignment is:

- Fewer feature slices in the short term.
- More pre-slice design.
- More executable gates.
- More explicit ownership of errors, accessibility, privacy, and AI safety.
- More honest slice status language.

The project can still become a high-quality production app, but only if the process now treats reliability, accessibility, safety, and data governance as product features rather than cleanup tasks.
