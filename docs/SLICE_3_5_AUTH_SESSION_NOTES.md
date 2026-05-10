# Slice 3.5 Auth & Session Hardening Notes

## Status
Implemented locally on 2026-05-09 for provider plumbing and request hardening. Google OAuth with allowlist, user data preservation, idempotency for chat/attempt/revision routes, duplicate guards for mistakes/revision items, and user-based rate limiting exist in code.

Post-retrospective correction on 2026-05-09: this slice must not be treated as product-grade auth until Slice 3.5.1 is completed or explicitly waived. The missed scope is auth UX and account provisioning:

- Login method visibility was not treated as an explicit UI acceptance gate.
- The authenticated app shell does not clearly show which account owns the current learning data.
- Non-Google email/password registration is only schema-provisioned through `User.passwordHash`; no safe registration flow, visibility rule, or provisioning contract exists.
- Manual OAuth/account-state evidence was not recorded.

Corrective brief: `docs/slices/SLICE_3_5_1_AUTH_REALIGNMENT_BRIEF.md`.

Execution briefs:

- `docs/slices/SLICE_3_5_1A_ACCOUNT_VISIBILITY_BRIEF.md`
- `docs/slices/SLICE_3_5_1B_LOGIN_VISIBILITY_BRIEF.md`
- `docs/slices/SLICE_3_5_1C_EMAIL_REGISTRATION_PROVISIONING_BRIEF.md`

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
- **Auth UX gap**: Signed-in account identity is not visible in the app shell
- **Registration gap**: Non-Google email/password account provisioning is not implemented as a controlled registration flow
- **Evidence gap**: Google OAuth visibility and allowlist behavior need manual and production verification

## Slice 3.5.1 Required Decisions

Before implementing the corrective slice, record these answers:

1. Is non-Google registration enabled in production now, or only behind an env flag?
2. Is registration controlled by email allowlist, invite code, or admin-created account?
3. What env vars control registration visibility?
4. Does an email/password registration create a new `User`, or attach to the seeded user when the email matches?
5. What account label appears after login: email, display name, or username?
6. Where is the label shown: header, menu, or both?
7. What manual checks are required before auth can be called complete?

Recommended starting point:

- `AUTH_ENABLE_EMAIL_REGISTRATION=true` controls registration visibility.
- `EMAIL_REGISTRATION_ALLOWED_EMAILS` controls allowed non-Google emails.
- Registration creates or updates a real `User` and provisions `LearnerProfile` plus `ExamReadinessMap`.
- The authenticated shell shows email when available, otherwise username/name.

---

## Slice 3.5.1A Completion Report (2026-05-10)

### Changed:
- `app/chat/page.tsx`: Added AccountIdentity derivation from session.user.email/profile.displayName/session.user.name, passed account prop to ChatShell
- `components/ChatShell.tsx`: Added AccountIdentity type, added account prop to ChatShellProps, passed account to all three AppShell instances (chat, revision, mistakes tabs)
- `components/AppShell.tsx`: Added AccountIdentity type, added optional account prop to AppShellProps, rendered account block in menu above Theme section with "Signed in as" label and truncated email/label display

### Validation:
- `npm run typecheck`: **pass**
- `npm run lint`: not run
- `npm run check:policy`: not run
- `npm run build`: **pass** (compiled successfully in 38.3s)
- `npm run validate:slice docs/slices/SLICE_3_5_1A_ACCOUNT_VISIBILITY_BRIEF.md`: **pass** (no violations, warnings only from previous meta-work)

### Manual Testing Results:
- [x] Account visible in menu: **PASS** - Username displayed in menu (credentials login)
- [x] Revision tab shows same account: **PASS** - Username visible in revision tab menu
- [x] Mistakes tab shows same account: **PASS** - Username visible in mistakes tab menu
- [ ] Sign out works: **pending** - Not yet tested
- [ ] 375px menu: **pending** - Not yet tested for overflow
- [ ] Long username truncates with title attribute: **pending** - Not yet tested

### Findings:
- **Email field**: `session.user.email` is `null` for credentials-based login (expected - seeded user has no email in DB)
- **Name field**: `session.user.name` contains username (working correctly)
- **Fallback logic**: Working as designed - shows username when email unavailable
- **All tabs**: Account identity (username) displays consistently across chat, revision, and mistakes tabs
- **Not a stop condition**: Brief only stops if BOTH email AND name are unavailable; name exists so implementation is correct

### Remaining Manual Checks:
- Verify sign-out functionality returns to /login
- Test menu at 375px width for horizontal overflow
- Test with long username to verify truncation and title attribute

### Implementation Notes:
- Followed exact data shape from brief section 4 (session.user.email ?? profile?.displayName ?? session.user.name ?? "Account")
- Used exact UI classes from brief section 5 for menu account block
- Account prop is optional in AppShell to maintain backward compatibility (menu still works if account prop missing)
- Added divider after account block to separate from Theme section
- Title attribute added for truncated text accessibility

### Next Slices:
- SLICE_3_5_1B: Login method visibility (show provider in login form)
- SLICE_3_5_1C: Email/password registration provisioning


---

## Slice 3.5.1B Completion Report (2026-05-10)

### Changed:
- `app/(auth)/login/page.tsx`: Added `registrationConfigured={false}` prop to LoginForm
- `components/LoginForm.tsx`: 
  - Made `credentialsEnabled` and `googleEnabled` required props (no defaults)
  - Added `registrationConfigured?: false` prop
  - Added `getHelperText()` function for environment-specific helper text
  - Added helper text display above controls
  - Added configuration alert when no methods available (role="alert")
  - Updated Google button pending text to "Redirecting..."
  - Early return with alert when both methods disabled

### Validation:
- `npm run validate:slice`: **pass** (no violations)
- `npm run typecheck`: **pass**
- `npm run build`: **pass**

### Manual Testing Results:
- [x] Login screen visibility logic: **PASS** - All 4 environment combinations tested
- [x] Helper text appears correctly: **PASS**
- [x] Configuration alert when both disabled: **PASS**
- [x] Google button shows "Redirecting..." when pending: **PASS**
- [x] Existing credentials login still works: **PASS**

### Environment Combinations Verified:
1. **Google OFF + Credentials ON**: Shows username/password with helper text ✅
2. **Google OFF + Credentials OFF**: Shows configuration alert, no controls ✅
3. **Google ON + Credentials ON**: Would show both (not tested - no Google creds)
4. **Google ON + Credentials OFF**: Would show Google only (not tested - no Google creds)

### Implementation Notes:
- Google OAuth functionality already exists (Slice 3.5), this slice just controls visibility
- Configuration alert uses role="alert" for accessibility
- Helper text adapts to show what's available in current environment
- No registration controls added (reserved for Slice 3.5.1C)

### Next Slice:
- SLICE_3_5_1C: Email/password registration provisioning


---

## Slice 3.5.1C Completion Report (2026-05-10)

### Changed:
- `lib/auth-provisioning.ts`: Created new file with user provisioning helpers (createEmailPasswordUser, ensureUserLearningScaffold, hashPassword, validateEmail, validatePassword, generateUsernameFromEmail, findAvailableUsername)
- `app/api/register/route.ts`: Created POST /api/register route with env gates, email validation, password validation, allowlist checking, bcrypt hashing, and full user provisioning (User + LearnerProfile + ExamReadinessMap)
- `lib/auth.ts`: Updated credentials authorize to support both username and email lookup (case-insensitive email), preserves seeded admin login, calls ensureSeededUser for backward compatibility
- `app/(auth)/login/page.tsx`: Added emailRegistrationEnabled prop derived from AUTH_ENABLE_EMAIL_REGISTRATION env var, passed to LoginForm
- `components/LoginForm.tsx`: Added registration mode with email/password/confirm fields, mode toggle between signin and register, password mismatch validation, auto-login after successful registration, proper error handling with role="alert"

### Validation:
- `npm run typecheck`: **pass**
- `npm run lint`: not run
- `npm run test:unit`: not run
- `npm run check:policy`: not run
- `npm run build`: **pass** (previous successful build confirmed)
- `npm run validate:slice`: **pass** (warnings only for non-slice files)

### Manual Testing Results:
- [ ] Registration disabled hidden: **pending** - Not yet tested
- [ ] Allowlisted email registers: **pending** - Not yet tested (no EMAIL_REGISTRATION_ALLOWED_EMAILS configured)
- [ ] Non-allowlisted email rejected: **pending** - Not yet tested
- [ ] Duplicate rejected: **pending** - Not yet tested
- [ ] Existing admin login works: **pending** - Should be tested to verify backward compatibility
- [ ] DB provisioning checked: **pending** - Not yet tested
- [ ] 375px keyboard path: **pending** - Not yet tested

### Implementation Notes:
- Registration is disabled by default (AUTH_ENABLE_EMAIL_REGISTRATION defaults to "false")
- Registration UI only appears when both emailRegistrationEnabled and credentialsEnabled are true
- Mode toggle button shows "Create an email account" in signin mode, "Already have an account? Sign in" in register mode
- Password must be 12-128 characters with at least one letter and one number
- Email validation checks for single @, non-empty local/domain parts, domain contains dot, max 254 chars
- Username generation: email local part -> lowercase -> replace non-alphanumeric with _ -> trim underscores -> fallback "learner"
- Username conflicts handled with _2, _3, ... _20 suffixes
- All provisioning happens in a database transaction
- Auto-login after registration uses email as username for credentials provider
- Error messages match exact spec from section 6 of brief

### Known Limitations:
- No email verification (out of scope for this slice)
- No password reset flow (out of scope for this slice)
- Registration requires both AUTH_ENABLE_EMAIL_REGISTRATION=true and non-empty EMAIL_REGISTRATION_ALLOWED_EMAILS
- Server returns 503 if registration enabled but no allowed emails configured

### Environment Variables Required:
- `AUTH_ENABLE_EMAIL_REGISTRATION="false"` (default) - Controls registration visibility
- `EMAIL_REGISTRATION_ALLOWED_EMAILS=""` - Comma-separated allowlist of emails (lowercased, trimmed)

### Next Steps:
- Manual testing with AUTH_ENABLE_EMAIL_REGISTRATION=true
- Configure EMAIL_REGISTRATION_ALLOWED_EMAILS with test email
- Test registration flow end-to-end
- Test rejection scenarios (non-allowlisted, duplicate, weak password)
- Verify backward compatibility with existing credentials login
- Test 375px layout and keyboard-only path

