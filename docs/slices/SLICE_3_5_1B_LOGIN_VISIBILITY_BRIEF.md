# Slice 3.5.1B Brief: Login Method Visibility And Configuration States

**Status:** planned  
**Parent:** `docs/slices/SLICE_3_5_1_AUTH_REALIGNMENT_BRIEF.md`  
**Primary protocol:** `docs/LOW_REASONING_DEV_PROTOCOL.md`  
**Navigation protocol:** `docs/DOC_NAVIGATION.md`

---

## 0. Context Navigation

Read in this order:

1. `docs/DOC_NAVIGATION.md` - confirms this is a focused auth UI task.
2. `docs/LOW_REASONING_DEV_PROTOCOL.md` - execution rules and stop conditions.
3. `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md` - auth/UI fake-control, drift, and evidence gates.
4. `docs/SLICE_MAP.md` - confirms Slice 3.5.1 status.
5. `docs/slices/SLICE_3_5_1_AUTH_REALIGNMENT_BRIEF.md` - parent scope and non-goals.
6. `docs/UX_ARCHITECTURE.md` section `Auth And Account Visibility` - auth UI visibility rules.
7. `docs/COMPONENT_CONTRACTS.md` section `LoginForm` - login form ownership and no-fake-registration rule.
8. `app/(auth)/login/page.tsx` - server-side env-derived visibility flags.
9. `components/LoginForm.tsx` - client-side sign-in UI.

Do not read:

- `lib/auth.ts` unless sign-in provider names fail at runtime.
- `prisma/schema.prisma`. This task must not change data.
- `components/AppShell.tsx`. Account display is Slice 3.5.1A.
- Prompt docs.

---

## 1. Goal

Make the `/login` screen honest about which sign-in methods are available in the current environment.

This task does not implement registration. It prevents silent hiding and fake controls.

---

## 1.5. ⚠️ CONSTRAINT CARD (Check Before EVERY Edit)

**Allowed files (section 2)**:
- `app/(auth)/login/page.tsx`
- `components/LoginForm.tsx`
- `docs/SLICE_3_5_AUTH_SESSION_NOTES.md` (completion evidence only)

**Forbidden areas (section 3)**:
- `lib/auth.ts` (STOP if provider changes needed)
- `app/api/register/route.ts` (STOP if registration seems needed - that's Slice 3.5.1C)
- `prisma/schema.prisma`
- `components/AppShell.tsx`
- `components/ChatShell.tsx`
- Any OpenAI or learning pipeline file

**Expected git diff**:
```
M app/(auth)/login/page.tsx
M components/LoginForm.tsx
```

**Mandatory checks before committing (section 10)**:
- [ ] Only allowed files modified?
- [ ] Login screen never blank when auth misconfigured?
- [ ] Google button only visible when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` present?
- [ ] Credentials fields only visible when fallback enabled?
- [ ] If both unavailable, configuration alert appears with no sign-in controls?
- [ ] No registration link/button appears?
- [ ] Existing credentials login still works?
- [ ] All 4 environment combinations covered: Google on/off × Credentials on/off?
- [ ] 375px layout does not overflow?

**Stop conditions (section 12)**:
- Implementing this requires changing `lib/auth.ts`
- Registration UI seems necessary (belongs to Slice 3.5.1C)
- Manual env toggle checks cannot be performed
- Existing credentials sign-in breaks

---

## 2. Allowed Files

- `app/(auth)/login/page.tsx`
- `components/LoginForm.tsx`
- `docs/SLICE_3_5_AUTH_SESSION_NOTES.md` only for completion evidence

---

## 3. Do Not Touch

- `lib/auth.ts`
- `app/api/register/route.ts`
- `prisma/schema.prisma`
- `components/AppShell.tsx`
- `components/ChatShell.tsx`
- Any OpenAI or learning pipeline file

---

## 4. Environment Truth Table

Compute these booleans in `app/(auth)/login/page.tsx`:

```ts
const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
const credentialsEnabled = (process.env.AUTH_ENABLE_CREDENTIALS_FALLBACK ?? "true").toLowerCase() !== "false";
const registrationConfigured = false;
```

For this task, `registrationConfigured` must stay `false`. Slice 3.5.1C owns real registration.

| Google | Credentials | Registration | Login UI |
|---|---|---|---|
| enabled | enabled | false | Show `Continue with Google`, separator `or`, credentials fields, helper copy: `Temporary credentials are still available for migration.` |
| enabled | disabled | false | Show only `Continue with Google`, helper copy: `Use your allowed Google account.` |
| disabled | enabled | false | Show credentials fields, helper copy: `Google sign-in is not configured for this environment.` |
| disabled | disabled | false | Show no form controls. Show configuration error: `No sign-in method is configured. Set Google OAuth credentials or enable the credentials fallback.` |

Do not show a `Register` button in this task.

---

## 5. Exact UI Copy

Use this copy exactly unless it causes a policy check failure.

Header helper above controls:

- If Google enabled and credentials enabled: `Use Google if your email is allowlisted, or use temporary credentials.`
- If Google enabled and credentials disabled: `Use your allowlisted Google account to continue.`
- If Google disabled and credentials enabled: `Google sign-in is not configured here. Use temporary credentials.`
- If no methods enabled: `No sign-in method is configured. Set Google OAuth credentials or enable the credentials fallback.`

Button labels:

- Google idle: `Continue with Google`
- Google pending: `Redirecting...`
- Credentials idle: `Sign in`
- Credentials pending: `Signing in...`

Error text:

- Credentials failure: `Incorrect username or password.`
- Google unavailable click should not happen because the button is hidden.
- No-method configuration uses `role="alert"`.

Registration note:

- Do not show any registration note or link in this task.

---

## 6. Required Component API

Update `LoginFormProps` to accept explicit state:

```ts
type LoginFormProps = {
  credentialsEnabled: boolean;
  googleEnabled: boolean;
  registrationConfigured?: false;
};
```

`registrationConfigured` is optional and must not render a control in this task.

If both sign-in methods are unavailable, `LoginForm` must render the configuration error and no input fields/buttons.

---

## 7. UX States

| State | Required Behavior |
|---|---|
| Happy path | Available methods are visible and usable. |
| Loading | Clicked method shows pending label and disables all sign-in controls. |
| Empty | No-method environment shows a clear configuration message, not a blank form. |
| Error | Failed credentials show inline error with `aria-live` or `role="alert"`. |
| Disabled | Buttons disable while pending or when required fields are empty. |
| Success | Existing redirect to `/chat` remains unchanged. |

---

## 8. Accessibility And Mobile

- Error/helper text must be readable at 375px.
- No-method message must use `role="alert"`.
- Existing Enter-to-submit behavior remains for credentials fields.
- Google and credentials buttons remain keyboard reachable.
- Focus styles remain visible.

---

## 9. Implementation Steps

1. Add `registrationConfigured={false}` when rendering `LoginForm` from `app/(auth)/login/page.tsx`.
2. Update `LoginFormProps` with required `credentialsEnabled`, required `googleEnabled`, and optional `registrationConfigured?: false`.
3. Add a helper function in `LoginForm.tsx` that returns the exact helper copy based on `googleEnabled` and `credentialsEnabled`.
4. Render helper copy above the controls.
5. If both methods are disabled, render only the configuration alert and return from the component.
6. Update Google button pending label to `Redirecting...` when pending.
7. Ensure credentials error uses accessible alert behavior.
8. Do not add registration UI.
9. Update `docs/SLICE_3_5_AUTH_SESSION_NOTES.md` with evidence after validation.

---

## 10. Acceptance Criteria

- Login screen never appears blank when auth is misconfigured.
- Google button appears only when Google env vars are present.
- Credentials fields appear only when fallback is enabled.
- If both are unavailable, no sign-in controls render and a configuration alert appears.
- No registration link/button appears.
- Existing credentials login still works.

---

## 11. Validation

Run:

```bash
npm run typecheck
npm run lint
npm run check:policy
npm run build
```

Manual checks by environment toggle:

- Google disabled, credentials enabled: credentials form visible with Google-not-configured helper.
- Google disabled, credentials disabled: configuration alert visible, no controls.
- Google enabled, credentials enabled: Google button and credentials form visible.
- Google enabled, credentials disabled: only Google button visible.
- 375px login layout does not overflow.
- Keyboard can use visible controls.

If real Google env vars are not available locally, document that Google-visible state was checked by temporary local env values only.

---

## 12. Stop Conditions

Stop if:

- Implementing this requires changing `lib/auth.ts`.
- Registration UI seems necessary. That belongs to Slice 3.5.1C.
- Manual env toggle checks cannot be performed or reasoned about.
- Existing credentials sign-in breaks.

---

## 13. Completion Report

Use this format:

```markdown
Changed:
- `app/(auth)/login/page.tsx`: [summary]
- `components/LoginForm.tsx`: [summary]

Validation:
- `npm run typecheck`: pass/fail
- `npm run lint`: pass/fail
- `npm run check:policy`: pass/fail
- `npm run build`: pass/fail

Manual:
- Google off / credentials on: pass/fail/not run
- Google off / credentials off: pass/fail/not run
- Google on / credentials on: pass/fail/not run
- Google on / credentials off: pass/fail/not run
- 375px layout: pass/fail/not run

Pending:
- [only if something remains]
```
