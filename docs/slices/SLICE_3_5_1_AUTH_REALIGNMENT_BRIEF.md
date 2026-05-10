# Slice 3.5.1 Brief: Auth UX And Account Provisioning Realignment

**Status:** planned  
**Primary protocol:** `docs/LOW_REASONING_DEV_PROTOCOL.md`  
**Navigation protocol:** `docs/DOC_NAVIGATION.md`  
**Purpose:** Correct the gap left by Slice 3.5: authentication must be visible, understandable, and safely provisioned, not only wired at provider level.

---

## Execution Split

Do not implement this parent brief directly. Execute the child briefs in order:

1. `docs/slices/SLICE_3_5_1A_ACCOUNT_VISIBILITY_BRIEF.md`
   - Shows which account is signed in after login.
   - Touches only `app/chat/page.tsx`, `components/ChatShell.tsx`, and `components/AppShell.tsx`.
2. `docs/slices/SLICE_3_5_1B_LOGIN_VISIBILITY_BRIEF.md`
   - Makes login method visibility and misconfiguration states explicit.
   - Touches only `/login` page and `LoginForm`.
3. `docs/slices/SLICE_3_5_1C_EMAIL_REGISTRATION_PROVISIONING_BRIEF.md`
   - Adds controlled non-Google email/password registration with database provisioning.
   - Touches auth API, auth provider logic, login UI, and provisioning helpers.

Each child brief is designed for a lower-reasoning implementation session with narrow file ownership and exact acceptance criteria.

---

## 0. Context Navigation

Read in this order:

1. `docs/DOC_NAVIGATION.md` - prevents loading the full docs directory and explains task-specific context packs.
2. `docs/LOW_REASONING_DEV_PROTOCOL.md` - execution rules, stop conditions, completion report format.
3. `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md` - auth/security/privacy gates, drift report, and waiver rules.
4. `docs/SLICE_MAP.md` - confirms this corrective slice is planned and blocks broader auth-dependent work.
5. `docs/SLICE_3_5_AUTH_SESSION_NOTES.md` - explains what Slice 3.5 implemented and what was missed.
6. `docs/UX_ARCHITECTURE.md` - defines required UI states, account visibility, accessibility, mobile, and error behavior.
7. `docs/COMPONENT_CONTRACTS.md` - defines `AppShell`, `LoginForm`, and account display responsibilities.
8. `docs/NAMING.md` - use for new state, callback, API, and error names.
9. `docs/ARCHITECTURE.md` - use only the auth/session and data ownership sections.
10. `prisma/schema.prisma` - confirms existing identity fields and whether a migration is needed.
11. `lib/auth.ts` - NextAuth provider, callbacks, session shaping, user provisioning.
12. `lib/seed.ts` - profile and exam-map provisioning pattern that registration must reuse.
13. `app/(auth)/login/page.tsx` and `components/LoginForm.tsx` - login/register entry UI.
14. `components/AppShell.tsx` and `app/chat/page.tsx` - authenticated account visibility path.

Do not read:

- `docs/RETROSPECTIVE_ARCHITECTURAL_ANALYSIS.md` in full unless a P0 decision is unclear. Use sections 4, 10, 11, and 12 only if needed.
- `docs/build_prompts/future_slice_prompts.md` unless product intent conflicts with this brief.
- Prompt files unless auth changes unexpectedly touch model behavior.

---

## 1. Goal

Make authentication product-grade at the UX and provisioning level:

- The login screen must clearly expose available sign-in paths.
- After login, the app must clearly show which account is signed in.
- Non-Google email/password registration must be intentionally designed and safely provisioned in the database if enabled.

This slice fixes an implementation-process failure: Slice 3.5 treated provider wiring as enough, but auth work affects user trust, account ownership, privacy, and future multi-user behavior.

---

## 2. Problem Statement

Confirmed gaps:

- Google OAuth is wired but only visible when env vars exist; there was no explicit UI evidence gate for this visibility.
- The authenticated shell has a sign-out control but does not show the signed-in email/account identity.
- `User.passwordHash` and email fields exist, but no registration UX/API contract exists for non-Google email accounts.
- Current docs say password-registration schema exists, but they do not define provisioning behavior, security constraints, or acceptance tests.

Impact:

- A user cannot easily confirm which account owns the learning data.
- A lower-reasoning implementation session can falsely mark auth work done by checking only provider code.
- Future uploads, privacy controls, exports, and deletion flows would be built on unclear identity UX.

---

## 3. Allowed Scope

Documentation phase allowed files:

- `docs/DOC_NAVIGATION.md`
- `docs/LOW_REASONING_DEV_PROTOCOL.md`
- `docs/SLICE_MAP.md`
- `docs/SLICE_3_5_AUTH_SESSION_NOTES.md`
- `docs/UX_ARCHITECTURE.md`
- `docs/COMPONENT_CONTRACTS.md`
- `docs/slices/SLICE_3_5_1_AUTH_REALIGNMENT_BRIEF.md`
- `docs/slices/SLICE_TEMPLATE.md`

Implementation phase allowed files:

- `app/(auth)/login/page.tsx`
- `components/LoginForm.tsx`
- `components/AppShell.tsx`
- `components/ChatShell.tsx`
- `app/chat/page.tsx`
- `lib/auth.ts`
- `lib/seed.ts`
- `prisma/schema.prisma`
- `prisma/migrations/*` only if a schema change is required
- `types/next-auth.d.ts`
- new `app/api/register/route.ts` only if registration is implemented as an API route
- new `lib/auth-provisioning.ts` if shared provisioning logic is needed
- focused tests if test tooling exists

---

## 4. Explicit Non-Goals

- Do not add open public registration without an allowlist, invite code, or explicit product decision.
- Do not add password reset in this slice.
- Do not add email magic-link auth in this slice.
- Do not add providers beyond Google and credentials/email-password.
- Do not implement profile settings, data export, or account deletion here.
- Do not change learning pipeline behavior.
- Do not implement image upload.

---

## 5. Required Product Decisions Before Code

Answer these in `docs/SLICE_3_5_AUTH_SESSION_NOTES.md` before implementation starts:

1. Is non-Google registration enabled in production now, or only documented/provisioned behind an env flag?
2. Is registration allowlisted by email, invite code, admin-created account, or open self-serve?
3. What environment variables control registration visibility?
4. Does a registered email/password user create a new `User`, or can it attach to the seeded user if the email matches?
5. What password requirements apply?
6. What error should display when registration is disabled?
7. What account label should appear in the authenticated shell: email, display name, or username?
8. Should the account label be visible in the header, only in the menu, or both?

Recommended initial decision:

- Use allowlisted email/password registration behind `AUTH_ENABLE_EMAIL_REGISTRATION=true`.
- Use `EMAIL_REGISTRATION_ALLOWED_EMAILS` for allowed non-Google emails.
- Do not allow public open registration.
- Provision `User`, `LearnerProfile`, and `ExamReadinessMap` in one server-side flow.
- Display signed-in email when available, otherwise username/name.

---

## 6. UX States

| State | Expected Behavior |
|---|---|
| Happy path | User sees Google sign-in when configured, credentials fallback when enabled, and registration only when explicitly enabled. |
| Loading | Sign-in/register buttons show pending state and prevent duplicate submits. |
| Empty | Not applicable; login page always has a clear primary action or a configuration message. |
| Error | Invalid credentials, denied Google email, disabled registration, duplicate account, weak password, and network/server failure each show clear inline errors. |
| Disabled | Buttons are disabled when required fields are missing, pending, or the method is not configured. |
| Success | User lands in `/chat`; account identity is visible in the authenticated shell menu and, if space allows, header/subheader. |

---

## 7. API/Data Contract

Current schema supports:

- `User.email`
- `User.authProvider`
- `User.providerAccountId`
- `User.passwordHash`
- `User.allowlisted`
- `LearnerProfile`
- `ExamReadinessMap`

Implementation contract if registration is added:

- Route: `POST /api/register` or server action from login/register page.
- Request fields: `email`, `password`, optional `displayName` if included.
- Validate email format, normalized lowercase email, password length/complexity, and allowlist/invite policy.
- Hash password with bcrypt before persistence.
- Create `User`, `LearnerProfile`, and `ExamReadinessMap` together or in a transaction/helper.
- Do not log raw password or full email in normal logs.
- Duplicate email returns controlled user-safe error.
- Registration must not create learning rows.
- Existing Google login still maps allowed Google identity safely.

Session contract:

- `session.user.id` remains the stable owner key.
- `session.user.email` should be present when available.
- `session.user.name` may be username/display name.
- Expose `authProvider` to session only if UI needs provider labeling.

---

## 8. Accessibility And Mobile

- Login and registration controls must be keyboard reachable.
- Inline errors must be programmatically associated or announced via `aria-live`.
- Account menu must expose signed-in account text to screen readers.
- Account label must not overflow at 375px; truncate visually but keep full value in `title` or accessible text.
- Sign-out remains reachable by keyboard.
- Focus remains visible on all auth controls.

---

## 9. Implementation Steps

Do this as smaller tasks, not one broad auth rewrite.

### Task A: Account Visibility

Use `docs/slices/SLICE_3_5_1A_ACCOUNT_VISIBILITY_BRIEF.md`.

1. Pass session account identity from `app/chat/page.tsx` into `ChatShell` and `AppShell`.
2. Add an `account` prop to `AppShell` with `label`, `email`, and `provider` where available.
3. Show signed-in account in the menu and optionally compactly in the header.
4. Preserve existing sign-out behavior.
5. Validate typecheck, lint, and mobile visual behavior.

### Task B: Login Method Visibility

Use `docs/slices/SLICE_3_5_1B_LOGIN_VISIBILITY_BRIEF.md`.

1. Make `/login` clearly show which sign-in methods are available.
2. If Google is not configured, do not silently hide all context; show credentials fallback or a setup-safe message.
3. If registration is disabled, do not show a fake register button.
4. If credentials fallback is disabled and Google is not configured, show a configuration error state.
5. Validate light/dark and keyboard flow.

### Task C: Non-Google Registration Provisioning

Use `docs/slices/SLICE_3_5_1C_EMAIL_REGISTRATION_PROVISIONING_BRIEF.md`.

1. Confirm product decisions in section 5.
2. Add the registration route/action behind env flags.
3. Add server-side validation and password hashing.
4. Reuse or extract provisioning logic for `User`, `LearnerProfile`, and `ExamReadinessMap`.
5. Add login page registration UI only when enabled.
6. Ensure newly registered account can sign in and owns its own learning data.
7. Document manual verification steps and known limitations.

---

## 10. Validation

Run after each task:

```bash
npm run typecheck
npm run lint
npm run test:unit
npm run check:policy
npm run build
```

Manual checks required:

- Login page with Google configured.
- Login page with Google missing and credentials enabled.
- Login page with credentials disabled and Google missing.
- Signed-in shell shows account identity.
- Sign-out returns to `/login`.
- Registration disabled state does not show fake controls.
- If registration is implemented: allowed email registers successfully.
- If registration is implemented: non-allowed email is rejected.
- 375px mobile login and menu.
- Keyboard-only login and menu.

---

## 11. Stop Conditions

Stop if:

- Registration policy is not decided.
- Email delivery or verification is requested but no provider is configured.
- A schema migration is needed but the migration impact is unclear.
- Google OAuth production credentials are unavailable for manual verification.
- The implementation would require broad account settings, password reset, or public user management.
- Unexpected worktree changes touch auth files.

---

## 12. Completion Evidence

Record in `docs/SLICE_3_5_AUTH_SESSION_NOTES.md`:

- Product decisions made.
- Files changed.
- Commands run.
- Manual auth checks completed.
- Which auth methods were verified locally.
- Which auth methods were verified in Railway/production.
- Known limitations and follow-up debt.

Do not mark this slice complete unless account visibility, login method visibility, and registration policy/provisioning are all verified or explicitly waived.
