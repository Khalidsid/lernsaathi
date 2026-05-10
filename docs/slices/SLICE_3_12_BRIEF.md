# Slice 3.12 Brief: Reliability Safety And Privacy Baseline

**Status:** planned  
**Primary protocol:** `docs/LOW_REASONING_DEV_PROTOCOL.md`  
**Purpose:** Make API, model, logging, rate-limit, and data-governance behavior explicit before image input.

---

## 0. Context Navigation

Read in this order:

1. `docs/DOC_NAVIGATION.md` - prevents broad context loading.
2. `docs/LOW_REASONING_DEV_PROTOCOL.md` - execution rules and stop conditions.
3. `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md` - security/privacy/AI gates, waiver rules, and operational debt ledger.
4. `docs/SLICE_MAP.md` - confirms Slice 3.12 status and blockers.
5. `docs/gates/API_VALIDATION_WHY.md` - explains API validation, error envelope, privacy, and safety requirements.
6. `docs/gates/DEFINITION_OF_DONE.md` - quality gates for all slices.
7. `docs/gates/TECH_DEBT_REGISTER.md` - P0 items addressed in this slice.
8. `docs/gates/SLICE_4_ENTRY_CRITERIA.md` - gates that must pass before Slice 4.
9. `prisma/schema.prisma` - data ownership and retention implications.
10. `lib/auth.ts`, `lib/idempotency.ts`, `lib/ratelimit.ts`, `lib/openai.ts` - auth, retry, rate, model, and logging behavior.
11. Allowed API route files - convert one route at a time.
12. `docs/DATA_GOVERNANCE.md` after it exists - privacy and retention decisions.

Do not read:

- UI notes unless a client error-display change is required.
- Prompt docs unless OpenAI prompt/model behavior changes.

---

## 1. Goal

Add safe request validation, controlled error responses, data governance documentation, and AI safety/model controls.

---

## 1.5. ⚠️ CONSTRAINT CARD (Check Before EVERY Edit)

**Allowed files (section 2)**:
- `app/api/chat/route.ts`
- `app/api/chat/attempt/route.ts`
- `app/api/revision/review/route.ts`
- `app/api/profile/route.ts`
- `app/api/learning-state/route.ts`
- `lib/openai.ts`
- `lib/ratelimit.ts`
- `lib/logging.ts`
- new `lib/api/*` helpers if needed
- `docs/DATA_GOVERNANCE.md`
- `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md`
- `docs/ARCHITECTURE.md`
- `docs/SLICE_MAP.md`

**Forbidden areas (section 3)**:
- UI behavior changes (STOP unless new error shape absolutely requires it)
- Image upload implementation
- Historical data migration
- Public account deletion UI (unless explicitly scoped)
- NextAuth replacement
- Prompt changes (except safety identifier/model metadata plumbing)

**Expected git diff**:
```
M app/api/chat/route.ts
M app/api/chat/attempt/route.ts
M app/api/revision/review/route.ts
M app/api/profile/route.ts (if in scope)
M app/api/learning-state/route.ts (if in scope)
M lib/openai.ts
M lib/ratelimit.ts (if implemented)
A lib/logging.ts (if created)
A lib/api/* (if helpers created)
A docs/DATA_GOVERNANCE.md
M docs/ACCOUNTABILITY_AND_QUALITY_GATES.md
M docs/ARCHITECTURE.md
M docs/SLICE_MAP.md
```

**Mandatory checks before committing (section 6)**:
- [ ] Only allowed files modified?
- [ ] Safe JSON parsing helper added?
- [ ] Zod request schemas added for mutating routes?
- [ ] Consistent API error response helper added?
- [ ] Backward compatibility preserved (unless client updates included)?
- [ ] Request ID added where feasible?
- [ ] Idempotency conflicts return controlled errors?
- [ ] Durable rate limiting strategy documented or implemented?
- [ ] Cleanup strategy for idempotency records documented?
- [ ] `docs/DATA_GOVERNANCE.md` created with retention/export/delete/logging/eval policy?
- [ ] OpenAI safety identifier added or documented why deferred?
- [ ] Model alias/snapshot policy documented?
- [ ] Raw user input NOT logged by default?
- [ ] Existing successful client behavior still compatible?
- [ ] Mutations still persist correctly and idempotency still works?

**Stop conditions (section 10)**:
- Error envelope requires changing many client surfaces without compatibility plan
- Durable rate limiting requires new external service decision
- Data deletion policy requires business/legal decision not present in docs
- OpenAI API option uncertain and official docs need checking

---

## 2. Allowed Scope

- `app/api/chat/route.ts`
- `app/api/chat/attempt/route.ts`
- `app/api/revision/review/route.ts`
- `app/api/profile/route.ts`
- `app/api/learning-state/route.ts`
- `lib/openai.ts`
- `lib/ratelimit.ts`
- `lib/logging.ts`
- new `lib/api/*` helpers if needed
- `docs/DATA_GOVERNANCE.md`
- `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md`
- `docs/ARCHITECTURE.md`
- `docs/SLICE_MAP.md`

---

## 3. Explicit Non-Goals

- Do not change UI behavior except to handle new error shape if required.
- Do not implement image upload.
- Do not migrate all historical data.
- Do not add public account deletion UI unless explicitly scoped.
- Do not replace NextAuth.
- Do not change prompts except safety identifier/model metadata plumbing.

---

## 4. Required Reads

- `docs/LOW_REASONING_DEV_PROTOCOL.md`
- `docs/gates/API_VALIDATION_WHY.md`
- `docs/gates/DEFINITION_OF_DONE.md`
- `docs/gates/TECH_DEBT_REGISTER.md`
- `docs/gates/SLICE_4_ENTRY_CRITERIA.md`
- `prisma/schema.prisma`
- `lib/auth.ts`
- `lib/idempotency.ts`
- `lib/ratelimit.ts`
- `lib/openai.ts`
- all API route files in allowed scope

---

## 5. UX States

| State | Expected Behavior |
|---|---|
| Happy path | Existing successful client behavior remains compatible. |
| Loading | Existing loading states remain unchanged. |
| Empty | Existing empty states remain unchanged. |
| Error | API returns controlled error codes and user-safe messages. |
| Disabled | Existing pending/disabled states remain unchanged. |
| Success | Mutations still persist correctly and idempotency still works. |

---

## 6. API/Data Contract

Required:

- Add safe JSON parsing helper.
- Add zod request schemas for mutating routes.
- Add consistent API error response helper.
- Preserve backward compatibility unless client updates are included.
- Add request id where feasible.
- Keep idempotency conflicts as controlled errors.
- Decide durable rate limiting strategy.
- Add or document cleanup strategy for idempotency records.

Data governance:

- Create `docs/DATA_GOVERNANCE.md`.
- Document retention, export, delete, logging redaction, and eval-data policy.
- Update `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md` if debt status, waiver status, or security/privacy/AI gate wording changes.

OpenAI:

- Add privacy-preserving safety identifier or document why it is deferred.
- Document model alias/snapshot policy.
- Do not log raw user input by default.

---

## 7. Accessibility And Mobile

No direct UI changes expected. If client error display changes:

- Error text must be readable at 375px.
- Retry buttons must be keyboard reachable.

---

## 8. Implementation Steps

1. Add API helper for safe JSON parsing and response shaping.
2. Add zod schemas route by route.
3. Convert `/api/chat` first.
4. Convert `/api/chat/attempt`.
5. Convert `/api/revision/review`.
6. Convert `/api/profile` and `/api/learning-state` if in scope.
7. Update OpenAI safety identifier/model policy.
8. Add `docs/DATA_GOVERNANCE.md`.
9. Document any rate-limit implementation or waiver.

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

Run `npm run eval` if OpenAI prompt/model behavior changed.

---

## 10. Stop Conditions

Stop if:

- Error envelope requires changing many client surfaces without a compatibility plan.
- Durable rate limiting requires a new external service decision.
- Data deletion policy requires business/legal decision not present in docs.
- OpenAI API option is uncertain and official docs need checking.

---

## 11. Completion Evidence

- Commands run:
- Routes converted:
- Routes deferred:
- Rate-limit decision:
- Data governance status:
- Known limitations:
- `docs/SLICE_MAP.md` status update:
