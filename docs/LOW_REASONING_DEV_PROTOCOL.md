# Low-Reasoning Development Protocol

**Purpose:** Make future development tasks executable by a smaller or lower-reasoning model with less context, fewer assumptions, and fewer session errors.  
**Applies to:** All future implementation, refactor, design, UI, API, prompt, and slice-planning tasks.  
**Rule:** If a task can be completed by following a checklist, write the checklist before coding.

---

## 1. Operating Principle

Do not depend on the model "understanding the whole project." A lower-reasoning model should succeed by using:

- A small context pack.
- Explicit file ownership.
- Clear non-goals.
- Step-by-step implementation instructions.
- Required validation commands.
- Stop conditions.
- A short completion report.

The task prompt should remove judgment where possible. If the model must make a judgment, the prompt must say exactly what tradeoff to use.

---

## 2. Required Start Sequence

Every dev session starts with this sequence:

1. Run `git status --short`.
2. Read `docs/DOC_NAVIGATION.md`.
3. Read `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md`.
4. Read `docs/SLICE_MAP.md`.
5. Read the current task brief.
6. Read only the relevant docs listed in the brief, using the reasons in its `Context Navigation` section.
7. List likely files to touch.
8. Confirm the task category:
   - UI
   - API
   - database
   - prompt/model
   - tests only
   - docs only
   - mixed
9. Check whether the task is blocked by P0 debt in `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md` and `docs/RETROSPECTIVE_ARCHITECTURAL_ANALYSIS.md`.
10. Implement the smallest safe change.
11. Run required validation.
12. Run the changed-files audit from `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md`.
13. Update docs/status/debt/evidence.

Do not read the entire docs directory unless the task explicitly asks for broad analysis. If the brief does not explain which docs to read and why, improve the brief before coding.

---

## 3. Context Pack Rules

### Always Read

- `docs/DOC_NAVIGATION.md`
- `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md`
- `docs/SLICE_MAP.md`
- The active task or slice brief.
- Files directly edited by the task.

### For UI Tasks Read

- `docs/UX_ARCHITECTURE.md`
- `docs/COMPONENT_CONTRACTS.md`
- `docs/NAMING.md`
- `docs/VISUAL_INTEGRATION_NOTES.md` only if changing visual language.
- `components/AppShell.tsx`
- `components/ChatShell.tsx`
- `app/globals.css`

### For API Tasks Read

- `docs/gates/API_VALIDATION_WHY.md` - request validation, error envelopes, rate limiting, observability, privacy.
- `docs/gates/DEFINITION_OF_DONE.md` - API-specific quality gates.
- `docs/gates/TECH_DEBT_REGISTER.md` - check if task addresses P0 debt.
- The exact route file.
- `lib/auth.ts`
- `lib/ratelimit.ts`
- `lib/idempotency.ts` if mutation/idempotency is involved.
- `prisma/schema.prisma` if data is persisted.

### For Prompt or Model Tasks Read

- `docs/PROMPT_PIPELINE.md`
- `prompts/system_core.md`
- `prompts/style_guide_hinglish.md`
- The exact prompt file being changed.
- `eval/run.mjs`
- Relevant golden examples.

### For Database Tasks Read

- `prisma/schema.prisma`
- Existing migrations.
- Routes and libs that read/write the affected model.
- `docs/DATA_GOVERNANCE.md` after it exists.

### Gate Files (docs/gates/)

**Purpose:** Extracted governance content with stable references.

**Always prefer gate files over Retrospective section numbers.** Section numbers are fragile and break when docs restructure.

Available gate files:
- `docs/gates/DEFINITION_OF_DONE.md` - Quality gates for all slices
- `docs/gates/TECH_DEBT_REGISTER.md` - P0/P1/P2/P3 debt items
- `docs/gates/SLICE_4_ENTRY_CRITERIA.md` - Production gates before image input
- `docs/gates/ROUTE_BOUNDARIES_WHY.md` - Loading/error boundary requirements (Slice 3.10)
- `docs/gates/API_VALIDATION_WHY.md` - API validation, privacy, safety requirements (Slice 3.12)
- `docs/gates/EVIDENCE_MATRIX.md` - Manual validation matrix (Slice 3.13)

**Usage:** Slice briefs reference these files in Context Navigation instead of "RETROSPECTIVE_ARCHITECTURAL_ANALYSIS.md sections X, Y, Z".

---

## 4. Work Packet Format

Every task given to a lower-reasoning model should use this packet.

```markdown
# Task: [short name]

## Goal
[one or two sentences]

## ⚠️ CONSTRAINT CARD (Check Before EVERY Edit)

**REQUIRED:** Every task brief MUST include this section immediately after Goal.

**Purpose:** Reduce working memory load by pre-extracting critical constraints into a single-page checklist.

**Allowed files**:
- [exact paths from "Allowed Files" section]

**Forbidden areas**:
- [exact paths with STOP conditions]

**Expected git diff**:
```
M path/to/file1.ts
A path/to/new/file.ts
```

**Mandatory checks before committing**:
- [ ] Only allowed files modified?
- [ ] [Key acceptance criterion]?
- [ ] [Validation passed]?

**Stop conditions**:
- [Condition requiring immediate halt]

## Allowed Files
- [exact file path]
- [exact file path]

## Do Not Touch
- [exact file path or area]
- [feature or behavior]

## Context Navigation
Read in this order:
1. `docs/DOC_NAVIGATION.md` - prevents broad context loading.
2. `docs/LOW_REASONING_DEV_PROTOCOL.md` - execution rules and stop conditions.
3. `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md` - debt, drift, waiver, changed-files audit, and risk gates.
4. `docs/SLICE_MAP.md` - current roadmap/status.
5. `[doc or source file]` - [why it matters for this task].

Do not read:
- `[doc]` unless [specific condition].

## Required Reads
- [doc path] - [why this doc is required]
- [source path] - [why this file is required]

## Implementation Steps
1. [specific step]
2. [specific step]
3. [specific step]

## Acceptance Criteria
- [observable outcome]
- [observable outcome]

## Validation
- npm run typecheck
- npm run lint
- [other command]

## Stop Conditions
- Stop if [condition].
- Stop if [condition].
```

Do not ask a lower-reasoning model to "improve the architecture" without this packet. Convert broad tasks into packets first. A packet that lists docs without reasons is incomplete.

---

## 5. Task Size Rules

Use smaller tasks than normal.

Good task size:

- One API route plus its tests.
- One UI component plus its loading/error states.
- One doc plus references.
- One schema migration plus one route update.
- One prompt plus eval cases.

Too large:

- "Fix accessibility everywhere."
- "Refactor all loading states."
- "Implement image upload."
- "Improve production readiness."
- "Clean up architecture."

Convert too-large tasks into 2 to 6 work packets before assigning.

---

## 6. Default Implementation Rules

### General

- Prefer small edits.
- Do not refactor unrelated files.
- Do not rename public contracts unless the task explicitly includes migration.
- Do not introduce new dependencies unless the task says so.
- Do not add fake controls or placeholder UI that appears functional.
- Do not leave TODO comments unless a debt-register entry is added.
- Do not change files outside the allowed scope without an Implementation Drift Report.

### UI

- Use `docs/UX_ARCHITECTURE.md` and `docs/COMPONENT_CONTRACTS.md`.
- Every visible async action needs loading, error, disabled, and success or saved state.
- Every interactive element must be keyboard reachable.
- Do not add global keyboard shortcuts without a text-entry guard.
- Keep mobile 375px behavior in mind while coding, not after.

### API

- Validate request bodies with a schema.
- Return controlled errors.
- Check auth and ownership before mutation.
- Preserve idempotency where retries can duplicate data.
- Do not log raw learner input by default.

### Prompt/Model

- Do not change prompts without adding or reviewing eval coverage.
- Do not remove formality rules.
- Do not expose exam pressure words to the learner unless the product decision changes.
- Keep structured output schemas strict.

### Database

- Add indexes when query patterns require them.
- Decide deletion behavior.
- Decide retention behavior.
- Keep migrations focused.

---

## 7. Stop Conditions

Stop and ask for direction if:

- `git status` shows unexpected changes in files you need to edit.
- The task requires network/package install and the command fails due to sandbox or network.
- The task needs a product decision not covered by docs.
- The task would change authentication, privacy, data retention, or model behavior without an ADR or brief.
- The task requires a destructive operation.
- Tests fail for reasons outside the touched scope and the cause is unclear.
- Manual validation is required but cannot be performed in the current environment.

Do not silently work around these conditions.

After implementation, run the changed-files audit in `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md`. If any source file changed outside allowed scope, stop and report drift before continuing.

---

## 8. Slice Status Words

Use these exact statuses in docs:

- `planned`: scoped but not started.
- `implemented locally`: code exists, not fully verified.
- `verified locally`: automated local gates pass.
- `manual evidence pending`: needs browser/device/human checks.
- `production smoke passed`: deployed route or flow was checked.
- `complete`: automated gates and required evidence are done.
- `waived`: a required gate was skipped with a written reason.

Do not use `complete` when manual evidence is still pending.

---

## 9. Completion Report Format

Every future dev task should end with:

```markdown
Changed:
- [file]: [what changed]

Validation:
- [command]: pass/fail/not run

Accountability:
- Changed-files audit: pass/fail
- Drift report needed: yes/no
- Debt opened: [ids or none]
- Debt closed: [ids or none]
- Waivers: [ids or none]
- Security gate: pass/fail/not applicable
- Privacy gate: pass/fail/not applicable
- AI/model gate: pass/fail/not applicable
- Manual evidence: complete/pending/not applicable

Pending:
- [manual check or blocker]

Next:
- [only if needed]
```

Keep it factual. Do not claim production readiness unless the defined gates passed.

---

## 10. Prompt Template For Future Dev Sessions

Use this when starting a new session:

```markdown
Read these first:
- `docs/DOC_NAVIGATION.md`
- `docs/LOW_REASONING_DEV_PROTOCOL.md`
- `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md`

Task: [short task]

Use this context only unless blocked:
- [brief path]
- [relevant docs]
- [source files]

Allowed files:
- [paths]

Do not touch:
- [paths or behaviors]

Implement exactly these steps:
1. [step]
2. [step]
3. [step]

Run:
- [commands]

Stop if:
- [conditions]
```
