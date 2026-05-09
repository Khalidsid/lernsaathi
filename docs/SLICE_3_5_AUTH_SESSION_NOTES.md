# Slice 3.5 Auth & Session Hardening Notes

## Status
Complete locally on 2026-05-09. All core functionality implemented: Google OAuth with allowlist, user data preservation, idempotency for chat/attempt/revision routes, duplicate guards for mistakes/revision items, and user-based rate limiting.

## Implementation Prompt
Original prompt: `docs/build_prompts/future_slice_prompts.md#slice-35---auth-and-session-hardening`

## Why this slice exists
Google-based authenticated login is now the preferred next auth direction, but the current app still reflects the original single-user credentials architecture. Before Slice 4 image upload/capture, the app needs stronger identity, ownership, and duplicate-request handling so uploaded files, chat writes, revision actions, and future multi-device usage stay safe.

## Current App Status
- Auth is NextAuth v5 with a Credentials provider only.
- Login depends on `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH`.
- `User` has `username`, login counters, and timestamps, but no `email`, OAuth provider identity, provider account id, role, password-registration state, or allowlist state.
- Most learning data is already scoped by `userId`: `LearningEvent`, `Mistake`, `LearnerProfile`, `ExamReadinessMap`, and revision reads/writes.
- Sessions use JWT strategy, and multiple browser sessions for the same user are conceptually possible.
- Rate limiting is an in-memory per-IP token bucket for `/api/chat`.
- Daily OpenAI spend cap is global and checked by summing `LearningEvent` token rows before model calls.
- Several write paths are not idempotent under duplicate clicks or parallel requests.

## Planned Scope
- Add Google OAuth as the primary login path.
- Use an allowlisted Google email policy first, not open public signup.
- Preserve the existing seeded user's learning data by mapping it to the allowlisted Google identity.
- Add schema provisions for future password registration without exposing public password registration yet.
- Keep existing learning data ownership based on stable `User.id`.
- Add durable identity fields or account tables needed for OAuth and future credentials accounts.
- Add request idempotency for duplicate chat submissions and revision actions.
- Add guarded creation for mistakes and revision items so parallel requests do not create duplicates.
- Revisit rate limiting and spend tracking so they can operate per user and survive multiple instances.

## Explicitly Out of Scope
- Public open registration.
- Password reset flow.
- Email magic-link auth.
- Social providers beyond Google.
- Image upload/capture implementation; that remains Slice 4 after this hardening slice.
- Learning pipeline or prompt rewrites.

## Design Decisions Made

### Authentication Architecture
- **Allowlist scope**: Multiple emails supported via comma-separated `GOOGLE_ALLOWED_EMAILS` environment variable
- **Credentials fallback**: Yes, retained as configurable fallback via `AUTH_ENABLE_CREDENTIALS_FALLBACK` env var (defaults to "true")
- **Password registration schema**: Uses `User.passwordHash` field directly, no separate account table
- **User data migration**: Google login maps to existing user via email, preserving all learning data

### Idempotency Design
- **Request key format**: Client-generated UUID sent via `x-idempotency-key` header
- **Key generation**: Frontend uses `crypto.randomUUID()` for all idempotent requests
- **Scope**: Implemented for `/api/chat`, `/api/chat/attempt`, and `/api/revision/review`
- **Storage**: `IdempotencyRequest` table with composite unique key on `(userId, route, key)`
- **Hash validation**: Prevents key reuse with different payloads (returns 409 on mismatch)

### Rate Limiting & Spend Tracking
- **Rate limiting**: Per-user token bucket via `checkUserRateLimit(userId)` - 10 requests per 60-second window
- **Spend tracking**: Global by default, but `assertDailySpendAvailable()` accepts optional `userId` parameter for future per-user caps
- **Daily cap**: Configurable via `DAILY_SPEND_CAP_USD` env var (defaults to $2.00)
- **Durability limitation**: Rate limiting uses in-memory Map - NOT suitable for multi-instance deployments (documented as known limitation)

### Duplicate Creation Guards
- **Mistakes**: Deduplicated via SHA-256 hash `dedupeKey` from `(userId, mistakeType, normalizedInput)` with unique constraint
- **Revision items**: Unique constraint on `sourceMistakeId` prevents duplicates; uses `upsert` pattern
- **Concurrent protection**: P2002 Prisma errors silently ignored during mistake/idempotency creation

## Implementation Evidence

### ✅ Acceptance Criteria Met
- ✅ Existing learning data preserved via email mapping (`lib/auth.ts:132-143`, `lib/auth.ts:169-178`)
- ✅ Non-allowlisted Google accounts rejected (`lib/auth.ts:159-167`)
- ✅ Login tracking works correctly (`lib/auth.ts:25-50`)
- ✅ Auth-gated routes enforce authentication (all `/api/*` routes check `session?.user?.id`)
- ✅ Double-submit chat prevented (`app/api/chat/route.ts:34-49`, `components/ChatShell.tsx:65`)
- ✅ Double-click revision review prevented (`app/api/revision/review/route.ts:30-45`, `lib/revision-data.ts:194-209` uses optimistic locking via `reviewCount`)
- ✅ Duplicate `RevisionItem` creation prevented (`lib/revision-data.ts:118-125` uses `upsert` with unique `sourceMistakeId`)
- ✅ Duplicate `Mistake` creation prevented (`lib/pipeline/mistakes.ts:122-151` uses `dedupeKey` unique constraint)
- ✅ Rate/spend controls implemented (`lib/ratelimit.ts:48-50`, `lib/openai.ts:49-74`)
- ✅ Password-registration schema exists (`User.passwordHash`), no public UI exposed

### ⚠️ Known Limitations
- **In-memory rate limiting**: Current implementation uses Map, not durable across restarts or multiple instances
- **Future work needed**: Move to Redis/database-backed rate limiting before horizontal scaling
- **Testing gap**: No automated tests for auth flows or idempotency edge cases
