# Slice 3.5 Auth & Session Hardening Notes

## Status
planned; no implementation yet

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

## Architecture Questions To Resolve Before Coding
- Should production permit only one allowlisted Google email or a small list of collaborator emails?
- Should the old credentials login remain as a temporary fallback during migration?
- Should future password registration use a `User.passwordHash` field or a separate credentials/account table?
- What request-id format should the client send for idempotent chat submissions?
- Should daily spend cap remain global, become per-user, or enforce both global and per-user limits?
- Should rate limiting move to database/Redis before multiple deployment instances are expected?

## Acceptance Criteria For Future Implementation
- Existing learning data remains attached to the migrated user.
- A non-allowlisted Google account cannot enter the app.
- Authorized Google login increments `loginCount`, sets `firstLoginAt` correctly, and updates `lastLoginAt`.
- Existing auth-gated routes still reject unauthenticated requests with `401` or redirect to `/login` as appropriate.
- Double-submit chat requests do not create duplicate persisted turns.
- Double-click revision review does not double-count progress.
- Parallel Revise tab loads do not create duplicate `RevisionItem` rows.
- Rate/spend controls are documented and tested for multiple sessions.
- Password-registration schema provisions exist if chosen, but no public password registration UI is exposed unless explicitly approved.
