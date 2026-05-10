# Slice 3.5.1C Brief: Email Registration Provisioning

**Status:** planned  
**Parent:** `docs/slices/SLICE_3_5_1_AUTH_REALIGNMENT_BRIEF.md`  
**Primary protocol:** `docs/LOW_REASONING_DEV_PROTOCOL.md`  
**Navigation protocol:** `docs/DOC_NAVIGATION.md`

---

## 0. Context Navigation

Read in this order:

1. `docs/DOC_NAVIGATION.md` - confirms this is a mixed UI/API/database auth task.
2. `docs/LOW_REASONING_DEV_PROTOCOL.md` - execution rules, stop conditions, completion report.
3. `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md` - auth/security/privacy/data gates, waiver rules, and debt ledger.
4. `docs/SLICE_MAP.md` - confirms Slice 3.5.1 status.
5. `docs/slices/SLICE_3_5_1_AUTH_REALIGNMENT_BRIEF.md` - parent intent and non-goals.
6. `docs/slices/SLICE_3_5_1A_ACCOUNT_VISIBILITY_BRIEF.md` - account identity must already be handled or explicitly pending.
7. `docs/slices/SLICE_3_5_1B_LOGIN_VISIBILITY_BRIEF.md` - login method visibility pattern must already exist or be implemented first.
8. `docs/ARCHITECTURE.md` auth direction section - identity and data ownership constraints.
9. `docs/UX_ARCHITECTURE.md` auth section - registration visibility and error behavior.
10. `docs/COMPONENT_CONTRACTS.md` `LoginForm` section - no fake controls and form ownership.
11. `prisma/schema.prisma` - confirms `User.email`, `User.passwordHash`, `LearnerProfile`, and `ExamReadinessMap` fields.
12. `lib/auth.ts` - credentials provider must support email/password sign-in after registration.
13. `lib/seed.ts` - provisioning pattern for profile and exam map.
14. `app/(auth)/login/page.tsx` and `components/LoginForm.tsx` - registration UI entry.

Do not read:

- Prompt docs. Registration does not touch model behavior.
- Revision/chat pipeline files. Registration must not touch learning flows.
- Full retrospective unless a P0 decision is unclear.

---

## 1. Goal

Add controlled non-Google email/password registration with real database provisioning.

Registration must create a usable account with:

- `User`
- `LearnerProfile`
- `ExamReadinessMap`
- hashed password
- stable `session.user.id` ownership after sign-in

Registration must not be open public signup.

---

## 1.5. ⚠️ CONSTRAINT CARD (Check Before EVERY Edit)

**Allowed files (section 3)**:
- `app/(auth)/login/page.tsx`
- `components/LoginForm.tsx`
- `lib/auth.ts`
- `lib/seed.ts` (only if extracting provisioning helper)
- new `lib/auth-provisioning.ts`
- new `app/api/register/route.ts`
- `types/next-auth.d.ts` (only if session typing needs `authProvider`)
- `.env.local.example` or equivalent env example
- `docs/SLICE_3_5_AUTH_SESSION_NOTES.md` (completion evidence)

**Forbidden areas (section 4)**:
- `prisma/schema.prisma` (STOP if fields insufficient - they should be)
- `prisma/migrations/*` (STOP unless schema change explicitly approved)
- Learning pipeline files
- Revision files
- Chat API routes
- OpenAI files
- Prompt files
- App shell account display files (unless 3.5.1A not done and explicitly combined)

**Expected git diff**:
```
A app/api/register/route.ts
A lib/auth-provisioning.ts
M lib/auth.ts
M app/(auth)/login/page.tsx
M components/LoginForm.tsx
```

**Mandatory checks before committing (section 14)**:
- [ ] Only allowed files modified?
- [ ] Registration disabled by default?
- [ ] Registration UI only appears when `AUTH_ENABLE_EMAIL_REGISTRATION=true`?
- [ ] Server rejects if allowed email list empty?
- [ ] Allowed email can register and sign in?
- [ ] Non-allowlisted email rejected?
- [ ] Duplicate email rejected?
- [ ] New user gets `LearnerProfile` and `ExamReadinessMap`?
- [ ] Existing seeded credentials still sign in?
- [ ] No password reset or open public signup added?
- [ ] No learning data created during registration?
- [ ] Password hashed with bcrypt (not stored plain)?
- [ ] 375px registration layout works?
- [ ] Keyboard-only registration path works?

**Stop conditions (section 16)**:
- Human wants open registration
- Email verification required (no email provider configured)
- Schema migration appears necessary
- Existing seeded credentials break and cause unclear
- Registration would touch chat/revision/pipeline files
- Password reset requested
- Validation cannot run

---

## 2. Required Product Decision

Use this decision unless the human explicitly changes it before implementation:

- Email/password registration is disabled by default.
- It is enabled only when `AUTH_ENABLE_EMAIL_REGISTRATION=true`.
- It is allowlisted by `EMAIL_REGISTRATION_ALLOWED_EMAILS`.
- Public open registration is not allowed.
- Registration creates a new `User` when the email does not exist.
- If the email already exists, return `account_exists`; do not silently attach or overwrite.
- The user signs in with email plus password after registration.

If the human asks for open registration, stop and request a new security/product decision brief before coding.

---

## 3. Allowed Files

- `app/(auth)/login/page.tsx`
- `components/LoginForm.tsx`
- `lib/auth.ts`
- `lib/seed.ts` only if extracting provisioning helper is necessary
- new `lib/auth-provisioning.ts`
- new `app/api/register/route.ts`
- `types/next-auth.d.ts` only if session typing needs `authProvider`
- `.env.local.example` or equivalent env example file if present
- `docs/SLICE_3_5_AUTH_SESSION_NOTES.md` for completion evidence

---

## 4. Do Not Touch

- `prisma/schema.prisma` unless current fields are insufficient. They should be sufficient.
- `prisma/migrations/*` unless a schema decision is explicitly approved.
- Learning pipeline files
- Revision files
- Chat API routes
- OpenAI files
- Prompt files
- App shell account display files unless 3.5.1A was not done and the human explicitly asks to combine work

---

## 5. Environment Variables

Add or document these variables:

```env
AUTH_ENABLE_EMAIL_REGISTRATION="false"
EMAIL_REGISTRATION_ALLOWED_EMAILS=""
```

Behavior:

| Env State | Behavior |
|---|---|
| `AUTH_ENABLE_EMAIL_REGISTRATION` missing | Registration disabled. |
| `AUTH_ENABLE_EMAIL_REGISTRATION=false` | Registration disabled. |
| `AUTH_ENABLE_EMAIL_REGISTRATION=true` and allowlist empty | Registration UI hidden; server rejects registration with `registration_not_configured`. |
| `AUTH_ENABLE_EMAIL_REGISTRATION=true` and email in allowlist | Registration UI visible; server allows that email if account does not exist. |
| `AUTH_ENABLE_EMAIL_REGISTRATION=true` and email not in allowlist | UI can submit, server rejects with `email_not_allowed`. |

Normalize allowlist entries by trimming and lowercasing.

---

## 6. API Contract

Create:

```text
POST /api/register
```

Request body:

```ts
type RegisterRequest = {
  email: string;
  password: string;
};
```

Success response, status `201`:

```ts
type RegisterSuccess = {
  ok: true;
};
```

Error response:

```ts
type RegisterError = {
  ok: false;
  code:
    | "registration_disabled"
    | "registration_not_configured"
    | "invalid_email"
    | "weak_password"
    | "email_not_allowed"
    | "account_exists"
    | "invalid_json"
    | "internal_error";
  message: string;
};
```

HTTP statuses:

| Code | Status |
|---|---|
| `registration_disabled` | 403 |
| `registration_not_configured` | 503 |
| `invalid_email` | 400 |
| `weak_password` | 400 |
| `email_not_allowed` | 403 |
| `account_exists` | 409 |
| `invalid_json` | 400 |
| `internal_error` | 500 |

Exact user-safe messages:

- `registration_disabled`: `Registration is not enabled for this app.`
- `registration_not_configured`: `Registration is enabled but no allowed emails are configured.`
- `invalid_email`: `Enter a valid email address.`
- `weak_password`: `Use at least 12 characters with a letter and a number.`
- `email_not_allowed`: `This email is not allowed for this private app.`
- `account_exists`: `That email already has an account. Sign in instead.`
- `invalid_json`: `Request body is invalid.`
- `internal_error`: `Could not create the account right now. Please try again.`

---

## 7. Validation Rules

Email:

- Trim and lowercase.
- Must contain one `@`.
- Must have non-empty local and domain parts.
- Domain must contain at least one `.`.
- Maximum length: 254 characters.

Password:

- Minimum length: 12 characters.
- Maximum length: 128 characters.
- Must include at least one ASCII letter.
- Must include at least one number.

Do not add a dependency for validation in this task. Use small local helper functions unless the project already has a validation helper by the time this task runs.

---

## 8. Provisioning Contract

Create `lib/auth-provisioning.ts` if needed.

It should export focused helpers:

```ts
export async function ensureUserLearningScaffold(userId: string): Promise<void>;
export async function createEmailPasswordUser(input: { email: string; passwordHash: string }): Promise<{ id: string }>;
```

Provisioning behavior:

1. Generate a username from email local part.
2. Create `User` with:
   - `username`
   - `email`
   - `passwordHash`
   - `authProvider: "email"`
   - `allowlisted: true`
3. Create `LearnerProfile` for the new user.
4. Create `ExamReadinessMap` with `DEFAULT_EXAM_READINESS_SKILLS`.
5. Use a transaction if practical.
6. If username conflicts, append a short numeric suffix.
7. If email conflicts, return `account_exists` from the route.

Username generation rule:

```text
local part before @ -> lowercase -> replace non a-z/0-9/_/- with _ -> trim _ -> fallback learner
```

Conflict suffix rule:

```text
base, base_2, base_3, ... base_20
```

If all 20 conflict, return `internal_error`.

Do not create learning events during registration.

---

## 9. Credentials Login Update

Update `lib/auth.ts` credentials provider so email/password users can sign in.

Current credentials login must continue to work for seeded admin username.

New behavior:

- The existing input field may still be named `username` for compatibility.
- Treat the submitted identifier as `identifier` internally.
- If identifier matches a `User.username`, allow password check against that user's `passwordHash`.
- If identifier looks like an email, also search `User.email` case-insensitively through normalized lowercase email.
- Continue calling `ensureSeededUser()` so legacy seeded admin remains provisioned.
- Do not allow login when `passwordHash` is missing.
- Return `id`, `name`, and `email` for the matched user.

Do not remove credentials fallback behavior.

---

## 10. Login UI Contract

Only show registration UI when:

```ts
const emailRegistrationEnabled =
  (process.env.AUTH_ENABLE_EMAIL_REGISTRATION ?? "false").toLowerCase() === "true";
```

Recommended server prop:

```ts
<LoginForm
  credentialsEnabled={credentialsEnabled}
  emailRegistrationEnabled={emailRegistrationEnabled}
  googleEnabled={googleEnabled}
/>
```

Client behavior:

- Add a small secondary button/link: `Create an email account` only when `emailRegistrationEnabled` is true.
- Registration mode fields:
  - `Email`
  - `Password`
  - `Confirm password`
- Button label: `Create account`
- Pending label: `Creating account...`
- On success, call `signIn("credentials", { username: email, password, redirect: false, callbackUrl })`.
- If sign-in succeeds, route to callback URL or `/chat`.
- If sign-in fails after successful creation, show: `Account created. Sign in with your email and password.`
- Add a secondary action: `Already have an account? Sign in`.

Do not add password reset links.
Do not show registration when disabled.

---

## 11. UX States

| State | Required Behavior |
|---|---|
| Happy path | Allowed email registers, signs in, and lands on `/chat`. |
| Loading | Registration submit disables fields and shows `Creating account...`. |
| Empty | Registration mode fields start empty with no error. |
| Error | API error message appears inline with alert semantics. |
| Disabled | Create button disabled until email, password, and confirmation are filled and passwords match. |
| Success | User reaches authenticated app and owns a new scaffolded learner record. |

---

## 12. Accessibility And Mobile

- Registration fields must have labels.
- Error text must use `role="alert"` or `aria-live="polite"`.
- All controls keyboard reachable.
- 375px layout must not overflow.
- Password mismatch should show inline text before submit or disable submit with clear reason.

---

## 13. Implementation Steps

1. Add env example entries for email registration if an example env file exists.
2. Add `lib/auth-provisioning.ts` with scaffold and user-creation helpers.
3. Create `app/api/register/route.ts` with env gate, safe JSON parse, validation, allowlist check, password hashing, and provisioning.
4. Update `lib/auth.ts` credentials authorize logic to support username or email lookup while preserving seeded admin login.
5. Update `app/(auth)/login/page.tsx` to pass `emailRegistrationEnabled`.
6. Update `components/LoginForm.tsx` with sign-in/register modes.
7. Keep registration hidden when env disabled.
8. Add or update docs evidence in `docs/SLICE_3_5_AUTH_SESSION_NOTES.md`.
9. Run validation.
10. Manually verify registration and sign-in behavior.

---

## 14. Acceptance Criteria

- Registration is disabled by default.
- Registration UI appears only when `AUTH_ENABLE_EMAIL_REGISTRATION=true`.
- Server rejects registration if allowed email list is empty.
- Allowed email can register and sign in.
- Non-allowlisted email is rejected.
- Duplicate email is rejected.
- New user gets `LearnerProfile` and `ExamReadinessMap`.
- Existing seeded credentials still sign in.
- No password reset or open public signup is added.
- No learning data is created during registration.

---

## 15. Validation

Run:

```bash
npm run typecheck
npm run lint
npm run test:unit
npm run check:policy
npm run build
```

Manual checks:

- Env disabled: no registration UI.
- Env enabled and allowlist empty: server rejects direct POST with `registration_not_configured`.
- Env enabled and email not in allowlist: UI/API rejects with `email_not_allowed`.
- Env enabled and email in allowlist: account created and signs in.
- Duplicate email: `account_exists`.
- Existing admin credentials still sign in.
- 375px registration layout.
- Keyboard-only registration path.

Database checks after allowed registration:

- `User.email` is set.
- `User.passwordHash` is set and not equal to raw password.
- `User.authProvider` is `email`.
- `User.allowlisted` is `true`.
- `LearnerProfile` exists for new user.
- `ExamReadinessMap` exists for new user.

---

## 16. Stop Conditions

Stop if:

- The human wants open registration.
- Email verification is required. That is a separate slice because no email provider is configured.
- A schema migration appears necessary.
- Existing seeded credentials break and the cause is unclear.
- Registration would require touching chat/revision/pipeline files.
- Password reset is requested.
- Validation cannot run.

---

## 17. Completion Report

Use this format:

```markdown
Changed:
- `app/api/register/route.ts`: [summary]
- `lib/auth-provisioning.ts`: [summary]
- `lib/auth.ts`: [summary]
- `app/(auth)/login/page.tsx`: [summary]
- `components/LoginForm.tsx`: [summary]

Validation:
- `npm run typecheck`: pass/fail
- `npm run lint`: pass/fail
- `npm run test:unit`: pass/fail
- `npm run check:policy`: pass/fail
- `npm run build`: pass/fail

Manual:
- Registration disabled hidden: pass/fail/not run
- Allowlisted email registers: pass/fail/not run
- Non-allowlisted email rejected: pass/fail/not run
- Duplicate rejected: pass/fail/not run
- Existing admin login works: pass/fail/not run
- DB provisioning checked: pass/fail/not run
- 375px keyboard path: pass/fail/not run

Pending:
- [only if something remains]
```
