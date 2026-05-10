# Slice 3.5.1A Brief: Signed-In Account Visibility

**Status:** planned  
**Parent:** `docs/slices/SLICE_3_5_1_AUTH_REALIGNMENT_BRIEF.md`  
**Primary protocol:** `docs/LOW_REASONING_DEV_PROTOCOL.md`  
**Navigation protocol:** `docs/DOC_NAVIGATION.md`

---

## 0. Context Navigation

Read in this order:

1. `docs/DOC_NAVIGATION.md` - confirms this is a small UI/auth context pack.
2. `docs/LOW_REASONING_DEV_PROTOCOL.md` - execution rules and stop conditions.
3. `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md` - auth/UI changed-files audit and no-drift rules.
4. `docs/SLICE_MAP.md` - confirms Slice 3.5.1 is the active auth corrective work.
5. `docs/slices/SLICE_3_5_1_AUTH_REALIGNMENT_BRIEF.md` - parent intent and non-goals.
6. `docs/UX_ARCHITECTURE.md` section `Auth And Account Visibility` - account identity UI rules.
7. `docs/COMPONENT_CONTRACTS.md` sections `AppShell` and `LoginForm` - shell ownership rules.
8. `app/chat/page.tsx` - source of authenticated session and profile data.
9. `components/ChatShell.tsx` - passes authenticated props into tab shells.
10. `components/AppShell.tsx` - renders header/menu/sign-out UI.

Do not read:

- `lib/auth.ts` unless `session.user.email` or `session.user.name` is missing in runtime evidence.
- `prisma/schema.prisma` unless a schema change is proposed. This task must not need one.
- Prompt docs. This task does not touch model behavior.

---

## 1. Goal

Show the learner which account owns the current learning data after login.

The account identity must be visible at least inside the authenticated shell menu, near `Sign out`. If there is enough header space, a compact account label may also appear under the wordmark.

---

## 1.5. ⚠️ CONSTRAINT CARD (Check Before EVERY Edit)

**Allowed files (section 2)**:
- `app/chat/page.tsx`
- `components/ChatShell.tsx`
- `components/AppShell.tsx`
- `docs/SLICE_3_5_AUTH_SESSION_NOTES.md` (completion evidence only)

**Forbidden areas (section 3)**:
- `lib/auth.ts` (STOP if `session.user.email` missing)
- `components/LoginForm.tsx`
- `app/(auth)/login/page.tsx`
- `prisma/schema.prisma`
- `prisma/migrations/*`
- API routes
- Prompt files

**Expected git diff**:
```
M app/chat/page.tsx
M components/ChatShell.tsx
M components/AppShell.tsx
```

**Mandatory checks before committing (section 9)**:
- [ ] Only allowed files modified?
- [ ] `session.user.email` available? (if NO: STOP, report missing field)
- [ ] Account identity visible in menu?
- [ ] Revision and mistakes tabs show same account identity?
- [ ] Sign out still works?
- [ ] No schema, API, or auth-provider files changed?
- [ ] No account id exposed to user?
- [ ] Long emails truncate visually with full value in `title` attribute?
- [ ] 375px menu does not overflow?

**Stop conditions (section 11)**:
- `session.user.email` AND `session.user.name` both unavailable
- Implementation requires changing `lib/auth.ts`
- Menu needs broad focus-management rewrite
- Any unrelated auth, registration, or schema change seems necessary

---

## 2. Allowed Files

- `app/chat/page.tsx`
- `components/ChatShell.tsx`
- `components/AppShell.tsx`
- `docs/SLICE_3_5_AUTH_SESSION_NOTES.md` only for completion evidence

---

## 3. Do Not Touch

- `lib/auth.ts`
- `components/LoginForm.tsx`
- `app/(auth)/login/page.tsx`
- `prisma/schema.prisma`
- `prisma/migrations/*`
- API routes
- Prompt files

If account identity cannot be sourced without touching `lib/auth.ts`, stop and report the missing session field instead of widening scope.

---

## 4. Exact Data Shape

Add this local UI type where needed. Do not create a global abstraction unless a TypeScript import cycle requires it.

```ts
type AccountIdentity = {
  label: string;
  email?: string | null;
};
```

Derive the account in `app/chat/page.tsx` after `profile` loads:

```ts
const accountLabel = session.user.email ?? profile?.displayName ?? session.user.name ?? "Account";
const account = {
  label: accountLabel,
  email: session.user.email ?? null,
};
```

Pass `account` into `ChatShell`, then pass it into every `AppShell` render path: chat, revision, and mistakes.

---

## 5. Exact UI Requirements

In `AppShell`:

- Add optional prop `account?: AccountIdentity`.
- In the menu, above `Theme`, render:
  - small uppercase label: `Signed in as`
  - account label: `account.email ?? account.label`
- Keep `Sign out` in the same menu, below the account identity and theme controls.
- The account label must truncate visually if long.
- Add `title={account.email ?? account.label}` to the visible account value.
- Do not expose raw user id.
- Do not show provider labels in this task.

Optional header label:

- You may show compact text under `Lernsaathi` with `account.label`.
- If this causes cramped mobile layout at 375px, keep account identity menu-only.

Suggested classes for menu account block:

```tsx
<div className="px-3 pb-2 pt-1.5">
  <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink4">Signed in as</div>
  <div className="mt-1 truncate text-[13px] text-ink2 dark:text-[#CFCDC4]" title={account.email ?? account.label}>
    {account.email ?? account.label}
  </div>
</div>
```

Adjust spacing only as needed to match existing menu rhythm.

---

## 6. UX States

| State | Required Behavior |
|---|---|
| Happy path | Signed-in user opens menu and sees the account label above theme/sign-out. |
| Loading | No new loading state. Existing page loading behavior remains. |
| Empty | If account prop is missing, menu still works and simply omits account block. |
| Error | No new error state. Do not add fallback alerts. |
| Disabled | Sign-out remains enabled as before. |
| Success | User can verify the current account before signing out. |

---

## 7. Accessibility And Mobile

- Menu button ARIA behavior remains unchanged.
- Account identity is plain text, not a menu item.
- Full account value must be available through `title` or accessible text when visually truncated.
- At 375px width, the menu must not overflow horizontally.
- Keyboard flow: open menu, tab/arrow through controls as before, sign out remains reachable.

---

## 8. Implementation Steps

1. Add `AccountIdentity` type to `components/ChatShell.tsx` or inline in both files if simpler.
2. Add `account` prop to `ChatShellProps`.
3. Pass `account` from `app/chat/page.tsx` into `ChatShell`.
4. Pass `account` into all three `AppShell` render paths in `ChatShell`.
5. Add optional `account` prop to `AppShellProps`.
6. Render account block inside the menu above `Theme`.
7. Do not change sign-out behavior.
8. Update `docs/SLICE_3_5_AUTH_SESSION_NOTES.md` with evidence after validation.

---

## 9. Acceptance Criteria

- Account identity is visible in the authenticated menu.
- Revision and mistakes tabs still show the same account identity.
- `Sign out` still works.
- No schema, API, or auth-provider files changed.
- No account id is exposed to the user.
- 375px menu does not overflow.

---

## 10. Validation

Run:

```bash
npm run typecheck
npm run lint
npm run check:policy
npm run build
```

Manual checks:

- Login with existing credentials.
- Open menu on Chat tab and confirm account label.
- Open menu on Revise tab and confirm account label.
- Open menu on Mistakes tab and confirm account label.
- Confirm sign-out returns to `/login`.
- Check 375px width for menu overflow.

---

## 11. Stop Conditions

Stop if:

- `session.user.email` and `session.user.name` are both unavailable.
- The implementation requires changing `lib/auth.ts`.
- The menu needs a broad focus-management rewrite.
- Any unrelated auth, registration, or schema change seems necessary.

---

## 12. Completion Report

Use this format:

```markdown
Changed:
- `app/chat/page.tsx`: [summary]
- `components/ChatShell.tsx`: [summary]
- `components/AppShell.tsx`: [summary]

Validation:
- `npm run typecheck`: pass/fail
- `npm run lint`: pass/fail
- `npm run check:policy`: pass/fail
- `npm run build`: pass/fail

Manual:
- Account visible in menu: pass/fail/not run
- Sign out works: pass/fail/not run
- 375px menu: pass/fail/not run

Pending:
- [only if something remains]
```
