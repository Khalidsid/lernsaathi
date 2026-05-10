# Accountability And Quality Gates

**Purpose:** Convert quality, debt, safety, security, privacy, and AI-development accountability into executable gates.  
**Applies to:** Every implementation, refactor, UI, API, database, auth, prompt/model, docs, and release-evidence task.  
**Rule:** If a task creates risk, debt, or a skipped gate, record it here or in the active release evidence before calling the task done.

This file is operational. The retrospective explains why the rules exist; this file defines what to do.

---

## 1. Required Use

Read this file when a task touches any of these:

- Authentication, account identity, sessions, roles, registration, sign-out, or ownership.
- API request/response behavior.
- Database schema, migrations, retention, export, deletion, or learner memory.
- User-facing UI state, accessibility, mobile behavior, error states, loading states, or controls.
- Logging, observability, rate limiting, idempotency, retries, or production deployment behavior.
- OpenAI model calls, prompts, structured output schemas, evals, safety identifiers, or model selection.
- Slice status, debt triage, waiver, or release evidence.

For docs-only tasks, read this file when the docs change process, gates, debt, privacy, safety, or slice execution rules.

---

## 2. Accountability Roles

The project may have one human developer, but every task still needs accountable roles.

| Role | Accountable For | Cannot Delegate To The Model |
|---|---|---|
| Human owner | Product/security decisions, production secrets, production deploy evidence, visual/browser judgment, waivers. | Final risk acceptance. |
| Implementation agent | Staying inside scope, making code/docs changes, running available validation, reporting drift and missing evidence honestly. | Product decisions not present in docs. |
| Reviewer agent or later session | Finding regressions, checking evidence, challenging incorrect status, closing or reopening debt. | Manual evidence not available in the environment. |
| Release owner | Deciding whether a slice can move from `manual evidence pending` to `complete`. | Waiving P0/P1 gates without written reason. |

If one person performs multiple roles, the report must still name which role made the decision.

---

## 3. Pre-Implementation Gate

Before editing files, every implementation task must define:

- Active brief path.
- Allowed files.
- Do-not-touch files or areas.
- Expected changed-file list.
- Relevant safety/security/privacy/AI review category.
- Required validation commands.
- Manual evidence required.
- Known debt touched or created.
- Rollback or fallback path.

If the active brief lacks these, update the brief first or stop.

Minimum pre-flight checklist:

```markdown
Pre-flight:
- Active brief: [path]
- Task type: UI/API/DB/auth/prompt/docs/mixed
- Allowed files: [list]
- Expected changed files: [list]
- Out-of-scope files: [list]
- Risk category: none/security/privacy/AI/data/auth/accessibility/reliability
- Existing P0/P1 debt touched: [ids or none]
- Rollback path: [how to revert or disable]
```

---

## 4. Changed-Files Audit

Before committing or marking work done, compare:

```bash
git diff --name-only
```

against the active brief's allowed files.

Classification:

| Result | Required Action |
|---|---|
| All changed files are allowed | Continue to validation. |
| Extra docs changed to update status/evidence | Allowed if named in completion report. |
| Extra source files changed | Stop and write an Implementation Drift Report. |
| Generated files changed unexpectedly | Explain source command or revert only if safe and user-approved. |
| Dependency lockfile changed | Explain dependency reason and approval. |

Implementation agents must not hide extra-file changes inside broad commits.

---

## 5. Implementation Drift Report

Use this when work goes outside scope, behavior changes unexpectedly, validation fails outside touched scope, or a lower-reasoning model made a broad/subpar change.

```markdown
# Implementation Drift Report

Date:
Task / brief:
Agent / role:

## Drift Type
- [ ] Changed file outside allowed scope
- [ ] Behavior changed outside acceptance criteria
- [ ] Validation failure outside touched scope
- [ ] Missing product/security/privacy decision
- [ ] Unplanned dependency or migration
- [ ] Manual evidence unavailable

## What Changed
- [file]: [change]

## Why It Happened
[short factual explanation]

## Risk
- User impact:
- Data/privacy impact:
- Security impact:
- AI/model impact:
- Deployment impact:

## Required Decision
[continue / split into new brief / revert with approval / waive / block]

## Recommended Next Step
[one concrete action]
```

Drift is not automatically failure. Hidden drift is failure.

---

## 6. Subpar Implementation Checklist

Use this checklist during review or before committing. Any checked item requires a fix, a debt entry, or a waiver.

| Check | Failure Signal | Required Response |
|---|---|---|
| Scope discipline | Broad refactor, unrelated rename, unrelated styling. | Split or revert with approval. |
| Fake controls | Button/link appears functional but has no real backend/behavior. | Remove, hide, or implement fully. |
| Missing states | No loading, error, disabled, empty, or success state for async UI. | Add states before completion. |
| Missing ownership | API/DB mutation does not check session/user ownership. | Fix before completion. |
| Weak validation | Route casts JSON or trusts client fields. | Add validation or debt/waiver if outside slice. |
| Inconsistent errors | Raw exception or ambiguous message. | Use controlled error pattern. |
| Privacy leak | Logs raw input, email, token, password, or full model output unnecessarily. | Remove/redact/hash. |
| AI drift | Prompt/model changed without eval or expected behavior note. | Add eval/review or revert. |
| Accessibility gap | Keyboard path/focus/ARIA missing for touched interactive UI. | Fix or record blocker. |
| Mobile gap | Touched UI not checked for 375px behavior. | Check or mark manual evidence pending. |
| Evidence inflation | Status says complete but manual evidence is pending. | Downgrade status. |
| Debt hidden | Known limitation buried in prose only. | Add debt entry or release evidence blocker. |

A task with unresolved checked P0/P1 items cannot be marked `complete`.

---

## 7. Technical Debt Register Schema

Every debt item must be recorded with this schema in the active evidence file or in a dedicated debt section.

```markdown
| ID | Priority | Status | Owner | Opened | Due Slice | Area | Evidence | Risk | Required Action | Closure Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
```

Field rules:

- `ID`: stable identifier, e.g. `DEBT-AUTH-001`, `DEBT-API-002`.
- `Priority`: `P0`, `P1`, `P2`, or `P3`.
- `Status`: `open`, `in_progress`, `blocked`, `waived`, `closed`.
- `Owner`: role, not vague `team`; e.g. `human owner`, `implementation agent`, `release owner`.
- `Opened`: ISO date.
- `Due Slice`: slice where it must be fixed or waived.
- `Area`: auth, API, UI, DB, privacy, AI, reliability, accessibility, docs.
- `Evidence`: concrete file/behavior proving the debt exists.
- `Risk`: what goes wrong if it stays open.
- `Required Action`: exact next fix or decision.
- `Closure Evidence`: command, manual check, PR/commit, or doc proving closure.

Priority rules:

| Priority | Meaning | Carry Forward Rule |
|---|---|---|
| P0 | Blocks production readiness, Slice 4, data safety, auth correctness, or core learner trust. | Cannot carry forward without explicit waiver. |
| P1 | Should be fixed before broad user testing or wider usage. | Can carry one slice with due date. |
| P2 | Valuable maintainability or polish debt. | Track opportunistically. |
| P3 | Nice-to-have or low-risk idea. | Track only if likely useful. |

---

## 8. Waiver Protocol

A waiver is a written risk acceptance. It is not a skipped checklist item.

Use this format:

```markdown
# Gate Waiver

Date:
Gate waived:
Priority:
Owner accepting risk:
Applies to slice/task:
Expires at slice/date:

## Reason
[why the gate cannot be completed now]

## Risk Accepted
[user/data/security/privacy/AI/deployment impact]

## Mitigation
[what reduces the risk until fixed]

## Recheck Trigger
[what event forces revisit]

## Closure Plan
[where and when it will be fixed]
```

Waiver rules:

- P0 waivers require explicit human-owner acceptance.
- P0 waivers must have an expiration slice/date.
- Security/privacy/auth/learner-data waivers must describe user/data impact.
- AI/model waivers must describe eval/safety impact.
- A waived gate cannot be silently forgotten; it remains in the debt register with `Status = waived`.

---

## 9. Safety, Security, Privacy, And AI Gates

### 9.1 Security/Auth Gate

Required for auth/session/account/API mutation work:

- Authenticated route checks `session.user.id` where required.
- Mutation verifies ownership of the affected record.
- Registration is not open public signup unless explicitly approved.
- Secrets stay in env vars; no secret values in docs, logs, or committed files.
- Error messages do not reveal sensitive internals.
- Rate limiting/idempotency behavior is documented for retryable mutations.

Stop if a security decision is missing.

### 9.2 Privacy/Data Gate

Required for learner memory, logs, export/delete, uploads, and database changes:

- Data collected is necessary for the feature.
- Retention and deletion impact is documented.
- Raw learner input is not logged by default.
- Emails/user ids are redacted or minimized in logs where practical.
- Production examples are not copied into evals without explicit policy.
- New data model has ownership and deletion behavior.

Stop if retention/export/delete behavior is unclear for a new memory feature.

### 9.3 AI/Model Gate

Required for prompt/model/OpenAI changes:

- Prompt file changes are explicit and reviewed.
- Structured output schema changes are versioned or backward compatible.
- `npm run eval` is run or a waiver explains why not.
- Expected behavior changes are documented.
- Safety/adversarial cases are considered for new capabilities.
- Model alias/snapshot policy is followed.
- Safety identifier policy is followed once implemented.
- Cost/latency impact is considered.

Stop if a model change cannot be evaluated or rolled back.

### 9.4 UI/Accessibility Gate

Required for user-facing UI:

- Happy, loading, empty, error, disabled, and success states are covered where relevant.
- Keyboard path exists.
- Focus is visible.
- Modal/menu behavior has close and return-focus plan.
- 375px mobile behavior is checked or marked manual evidence pending.
- Screen reader/live region behavior is considered for dynamic updates.
- No fake controls ship.

Stop if a visible control has no real behavior and is not clearly disabled/explained.

### 9.5 Reliability/Deployment Gate

Required for production-affecting behavior:

- Build passes or failure is documented.
- Route-level failure has controlled recovery if in scope.
- Idempotency protects duplicate writes where retry/double-click can happen.
- Rate-limit behavior is deployment-appropriate or waived.
- Observability/logging does not leak sensitive data.
- Rollback or feature-disable path exists.

Stop if the deployment path would fail silently or corrupt data.

---

## 10. Commit Readiness Checklist

Before commit/push:

```markdown
Commit readiness:
- [ ] Active brief followed.
- [ ] Changed files match allowed files or drift is reported.
- [ ] No fake controls added.
- [ ] Required validation run and recorded.
- [ ] Manual evidence recorded or marked pending.
- [ ] Debt created/closed recorded.
- [ ] Waivers recorded with owner and expiration.
- [ ] Security/privacy/AI gates checked where relevant.
- [ ] Slice status language is accurate.
```

Do not commit a slice as `complete` if any required evidence is pending.

---

## 11. Current Seed Debt Ledger

This table seeds operational debt tracking from the retrospective. Future work may move this to a dedicated `docs/TECH_DEBT_REGISTER.md` if it grows too large.

| ID | Priority | Status | Owner | Opened | Due Slice | Area | Evidence | Risk | Required Action | Closure Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| DEBT-AUTH-001 | P0 | open | human owner + implementation agent | 2026-05-09 | 3.5.1 | auth/UI/data | OAuth wired but account identity and email registration provisioning are incomplete. | User cannot verify data ownership; future account features build on unclear identity. | Execute 3.5.1A, 3.5.1B, 3.5.1C or record explicit waiver. | Pending. |
| DEBT-APP-001 | P0 | open | implementation agent | 2026-05-09 | 3.10 | framework/reliability | No route `loading.tsx` / `error.tsx`. | Route failures/loading states are uncontrolled. | Add route boundaries and verify script. | Pending. |
| DEBT-API-001 | P0 | open | implementation agent | 2026-05-09 | 3.12 | API/reliability | Routes cast JSON and return inconsistent errors. | Bad inputs and retry failures can produce uncontrolled behavior. | Add validation and error envelope. | Pending. |
| DEBT-PRIV-001 | P0 | open | human owner + implementation agent | 2026-05-09 | 3.12 | privacy/data | Learner raw input/responses have no retention/export/delete policy. | Privacy obligations and learner trust are undefined. | Create data governance doc and procedures. | Pending. |
| DEBT-RATE-001 | P0 | open | human owner + implementation agent | 2026-05-09 | 3.12 | reliability/security | `lib/ratelimit.ts` uses in-memory `Map`. | Multi-instance/cold-start behavior is unreliable. | Replace with durable strategy or document single-instance waiver. | Pending. |
| DEBT-EVID-001 | P0 | open | release owner | 2026-05-09 | 3.13 | evidence/release | Manual browser/mobile/accessibility evidence is incomplete. | Status can overstate readiness. | Run evidence matrix and update release evidence. | Pending. |
| DEBT-AI-001 | P1 | open | implementation agent | 2026-05-09 | 3.12 | AI/safety | OpenAI requests do not include privacy-preserving safety identifier. | Abuse/safety traceability is weaker. | Add hashed safety identifier or waiver. | Pending. |
| DEBT-AI-002 | P1 | open | human owner + implementation agent | 2026-05-09 | 3.12 | AI/model | No model alias/snapshot upgrade policy. | Model behavior can change without release discipline. | Add model governance policy. | Pending. |

---

## 12. Completion Report Addendum

Every future completion report should include this block:

```markdown
Accountability:
- Changed-files audit: pass/fail
- Drift report needed: yes/no
- Debt opened: [ids or none]
- Debt closed: [ids or none]
- Waivers: [ids or none]
- Security gate: pass/fail/not applicable
- Privacy gate: pass/fail/not applicable
- AI/model gate: pass/fail/not applicable
- Manual evidence: complete/pending/not applicable
```
