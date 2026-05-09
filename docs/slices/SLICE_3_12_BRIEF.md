# Slice 3.12 Brief: Reliability Safety And Privacy Baseline

**Status:** planned  
**Primary protocol:** `docs/LOW_REASONING_DEV_PROTOCOL.md`  
**Purpose:** Make API, model, logging, rate-limit, and data-governance behavior explicit before image input.

---

## 1. Goal

Add safe request validation, controlled error responses, data governance documentation, and AI safety/model controls.

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
- `docs/RETROSPECTIVE_ARCHITECTURAL_ANALYSIS.md` sections 8, 11, 12, 15
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

