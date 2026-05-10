# Slice Brief Template

Copy this file for each future slice:

```text
docs/slices/SLICE_[NUMBER]_BRIEF.md
```

---

## 1. Goal

[One or two sentences. State the user/product outcome.]

---

## 1.5. ⚠️ CONSTRAINT CARD (Check Before EVERY Edit)

**REQUIRED:** Every slice brief MUST include this section. Low-reasoning models need explicit constraints visible in a single location.

**Allowed files (section 2)**:
- `path/to/file1.ts`
- `path/to/file2.tsx`
- `docs/COMPLETION_NOTES.md` (evidence only)

**Forbidden areas (section 3)**:
- `forbidden/path/*` (STOP if [specific concern])
- Database migrations (STOP unless [specific condition])
- Authentication files (STOP if [specific concern])

**Expected git diff**:
```
M path/to/file1.ts
M path/to/file2.tsx
A new/file/if/needed.ts
```

**Mandatory checks before committing**:
- [ ] Only allowed files modified?
- [ ] [Key acceptance criterion from section X]?
- [ ] [Another key criterion]?
- [ ] [Mobile/keyboard/accessibility criterion]?
- [ ] [Validation command passed]?

**Stop conditions (from section Y)**:
- [First stop condition]
- [Second stop condition]
- [Third stop condition]

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

### Context Navigation

Read in this order:

1. `docs/DOC_NAVIGATION.md` - prevents broad context loading.
2. `docs/LOW_REASONING_DEV_PROTOCOL.md` - execution rules, stop conditions, completion format.
3. `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md` - debt, drift, waiver, changed-files audit, and risk gates.
4. `docs/SLICE_MAP.md` - current roadmap/status and blockers.
5. [relevant architecture/design doc] - [why it matters].
6. [specific source file] - [why it is touched or inspected].

Do not read:

- [doc path] unless [specific condition].

### Required Reads

- `docs/DOC_NAVIGATION.md` - route the context pack.
- `docs/LOW_REASONING_DEV_PROTOCOL.md` - follow execution protocol.
- `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md` - enforce debt, drift, waiver, changed-files audit, and risk gates.
- `docs/SLICE_MAP.md` - confirm current status and blockers.
- [relevant architecture/design docs] - [why each is required]
- [specific source files] - [why each is required]

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
- Changed-files audit fails and no Implementation Drift Report is written.

---

## 11. Accountability Gates

- Changed-files audit:
- Security gate:
- Privacy/data gate:
- AI/model gate:
- UI/accessibility gate:
- Reliability/deployment gate:
- Debt opened:
- Debt closed:
- Waivers:
- Rollback path:

Use `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md` for the exact templates.

---

## 12. Completion Evidence

- Commands run:
- Manual checks:
- Known limitations:
- Debt register updates:
- Waivers:
- Changed-files audit result:
