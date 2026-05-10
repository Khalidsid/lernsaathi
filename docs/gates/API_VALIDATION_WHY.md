# API Validation, Privacy, and Safety: Why They Matter

**Source:** Extracted from `RETROSPECTIVE_ARCHITECTURAL_ANALYSIS.md` section 8
**Purpose:** Explains production reliability requirements for Slice 3.12
**Context:** Move from prototype reliability to production-aware reliability

---

## Objective

Move from prototype reliability to production-aware reliability by adding:
- Request validation
- Error envelopes
- Distributed rate limiting
- Privacy/retention policy
- AI safety controls

---

## API Validation

### Why It Matters

**Problem:** Routes currently cast `await request.json()` directly
**Impact:** Malformed JSON, schema mismatch, and retryable failures are not classified consistently

**Solution:** Add request validation for all API routes using `zod` (already in dependencies)

### Suggested Constraints

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

**Rule:** Malformed JSON must return a controlled `400`, not an uncaught exception.

---

## Error Envelope

All API routes should return consistent error shapes:

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

**Decision required:** Choose one model and document it before changing client code.

---

## Distributed Rate Limiting

### Why It Matters

**Problem:** Current `lib/ratelimit.ts` uses in-memory `Map`
**Impact:** Does not work correctly across multiple server instances or cold starts

### Acceptable Options

- Redis or Upstash token bucket
- Database-backed fixed window for low-traffic single-user deployments
- Platform-native rate limit if deployment platform provides it

### Minimum Dimensions

- `userId`
- route
- IP or forwarded IP
- time window
- reset timestamp

### Headers to Include

```text
RateLimit-Limit
RateLimit-Remaining
RateLimit-Reset
Retry-After
```

---

## Observability

Add root `instrumentation.ts` and structured request logging.

### Minimum Log Fields

- `requestId`
- route
- method
- status
- latency
- user id hash (not raw user id where avoidable)
- model
- token counts
- OpenAI latency
- error code

### Do NOT Log

- Raw learner input by default
- Full model output by default
- Passwords, hashes, auth tokens, idempotency keys
- Email addresses unless explicitly redacted or hashed

**Current issue:** `inputPreview` logging should be revisited and either removed, hashed, or controlled by a safe debug flag.

---

## Privacy and Retention

Create `docs/DATA_GOVERNANCE.md` with these decisions:

### Required Decisions

- How long to retain `LearningEvent.rawInput`?
- How long to retain `LearningEvent.attemptText`?
- How long to retain model responses?
- Whether to allow export?
- Whether to allow full account deletion?
- Whether prompt/eval work can use production examples?
- Whether admin/stats should be renamed or role-gated?
- Whether deletion should cascade to mistakes, revision items, exam maps, and idempotency records?

### Minimum Implementation Before Broader Use

- Document retention policy
- Add deletion procedure (even if manual)
- Add export procedure (even if manual)
- Add idempotency cleanup strategy

---

## AI Safety and Model Governance

### Required Additions

- `safety_identifier` on OpenAI requests using stable privacy-preserving hash
- Model policy document: alias vs pinned snapshot, upgrade process, rollback process
- Safety/adversarial eval cases
- User-visible limitation text
- User issue-reporting path
- Handling for OpenAI safety blocks and upstream errors

### Suggested Policy

- **Development:** May use model alias
- **Production:** Should either pin snapshot OR treat alias movement as release event
- **Model changes:** Require eval comparison and manual review of representative examples

---

## Exit Criteria

- [ ] API request validation exists for all current mutating routes
- [ ] Error envelope documented and implemented on `/api/chat`, `/api/chat/attempt`, `/api/revision/review`
- [ ] Rate limiting no longer depends only on in-memory state, OR deployment waiver documents why single-instance is guaranteed
- [ ] `docs/DATA_GOVERNANCE.md` exists
- [ ] OpenAI requests include privacy-preserving safety identifier, OR documented reason not to
