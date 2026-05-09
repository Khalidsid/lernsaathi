# Slice Brief Template

Copy this file for each future slice:

```text
docs/slices/SLICE_[NUMBER]_BRIEF.md
```

---

## 1. Goal

[One or two sentences. State the user/product outcome.]

---

## 2. Allowed Scope

- [file or area]
- [file or area]

---

## 3. Explicit Non-Goals

- [what not to build]
- [what not to refactor]
- [what not to change]

---

## 4. Required Reads

- `docs/LOW_REASONING_DEV_PROTOCOL.md`
- `docs/SLICE_MAP.md`
- [relevant architecture/design docs]
- [specific source files]

---

## 5. UX States

| State | Expected Behavior |
|---|---|
| Happy path | [behavior] |
| Loading | [behavior] |
| Empty | [behavior] |
| Error | [behavior] |
| Disabled | [behavior] |
| Success | [behavior] |

---

## 6. API/Data Contract

- Routes touched:
- Request schema:
- Response schema:
- Database models touched:
- Idempotency behavior:
- Rate limit behavior:
- Logging behavior:

---

## 7. Accessibility And Mobile

- Keyboard path:
- Focus behavior:
- ARIA/live region behavior:
- 375px mobile behavior:
- Reduced motion behavior:

---

## 8. Implementation Steps

1. [small step]
2. [small step]
3. [small step]

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

Run `npm run eval` if prompts or model behavior changed.

---

## 10. Stop Conditions

Stop if:

- Required product decision is missing.
- Unexpected worktree changes affect touched files.
- Required validation cannot run.
- Implementation requires changing files outside allowed scope.

---

## 11. Completion Evidence

- Commands run:
- Manual checks:
- Known limitations:
- Debt register updates:

