# Documentation Navigation

**Purpose:** Route future implementation agents to the smallest safe context pack. Do not read the whole docs directory by default.

**Rule:** Every execution task starts from this file, `docs/LOW_REASONING_DEV_PROTOCOL.md`, `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md`, `docs/SLICE_MAP.md`, and the active task or slice brief. The active brief must say which other docs to read and why.

---

## 1. Read Order For Any Task

1. `git status --short`
2. `docs/DOC_NAVIGATION.md`
3. `docs/LOW_REASONING_DEV_PROTOCOL.md`
4. `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md`
5. `docs/SLICE_MAP.md`
6. Active task or slice brief in `docs/slices/`
7. Only the docs and source files listed in that brief
8. Stop if the brief does not include enough context to decide safely

Do not load every retrospective, slice note, design note, and source file in one session unless the task is explicitly a broad audit.

---

## 2. Document Roles

| Doc | Role | Read When |
|---|---|---|
| `docs/DOC_NAVIGATION.md` | Routes context and prevents overload. | Every implementation or planning task. |
| `docs/LOW_REASONING_DEV_PROTOCOL.md` | Defines how agents execute tasks. | Every implementation or planning task. |
| `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md` | Operational debt, waiver, drift, safety/security/privacy/AI gates. | Any implementation task; any docs task that changes gates, debt, privacy, safety, or slice execution rules. |
| `docs/SLICE_MAP.md` | Current roadmap and slice status. | Every implementation or planning task. |
| `docs/slices/SLICE_*_BRIEF.md` | Active executable work packet. | Always read the one brief for the current task. |
| `docs/RETROSPECTIVE_ARCHITECTURAL_ANALYSIS.md` | Full governance and debt rationale. | Only for P0 debt, broad audits, or when a brief cites exact sections. |
| `docs/ARCHITECTURE.md` | System structure and major boundaries. | Architecture, auth, DB, routing, or cross-cutting changes. |
| `docs/UX_ARCHITECTURE.md` | UI state, layout, mobile, accessibility rules. | Any UI or user-facing behavior change. |
| `docs/COMPONENT_CONTRACTS.md` | Component ownership and non-goals. | Any component edit or new component. |
| `docs/NAMING.md` | Naming rules for states, callbacks, errors, tests. | New APIs, components, helpers, or refactors. |
| `docs/PROBLEM_FIRST_LEARNING_JOURNEYS.md` | Active product direction for problem-first landing, six tiles, compact coach, and journey flow. | Slice 3.14-3.16 or any dashboard/mode/journey work. |
| `docs/PROMPT_PIPELINE.md` | LLM pipeline structure and prompt behavior. | Prompt, model, decision engine, or response-shape changes. |
| `docs/DATA_GOVERNANCE.md` | Learner data retention/export/delete policy. | After it exists: any learner data, auth, privacy, upload, or logging work. |
| Legacy slice notes | Historical evidence and decisions. | Only when the active brief cites the exact note. |

---

## 3. Task-Type Context Packs

Use the smallest matching pack. If a task crosses categories, combine only the relevant rows.

| Task Type | Required Docs | Why |
|---|---|---|
| UI component | `ACCOUNTABILITY_AND_QUALITY_GATES.md`, `UX_ARCHITECTURE.md`, `COMPONENT_CONTRACTS.md`, `NAMING.md` | Defines states, ownership, accessibility, mobile, naming, fake-control and evidence gates. |
| Problem launcher / journey UI | `PROBLEM_FIRST_LEARNING_JOURNEYS.md`, `UX_ARCHITECTURE.md`, `COMPONENT_CONTRACTS.md`, `NAMING.md`, active slice brief | Prevents agents from reverting to generic chat-first or feature-first dashboard behavior. |
| Auth/session | `ACCOUNTABILITY_AND_QUALITY_GATES.md`, `ARCHITECTURE.md`, active auth brief, `UX_ARCHITECTURE.md`, `COMPONENT_CONTRACTS.md`, `prisma/schema.prisma`, `lib/auth.ts` | Auth changes affect identity, data ownership, UI visibility, privacy, and security. |
| API route | `ACCOUNTABILITY_AND_QUALITY_GATES.md`, Retrospective sections 8, 11, 12 if cited, exact route file, `lib/auth.ts`, `lib/idempotency.ts` if mutation | Defines validation, error envelope, auth, ownership, retry behavior, drift and debt rules. |
| Database | `ACCOUNTABILITY_AND_QUALITY_GATES.md`, `ARCHITECTURE.md`, `prisma/schema.prisma`, existing migrations, affected routes/libs | Prevents schema drift and requires retention/deletion/debt decisions. |
| Prompt/model | `ACCOUNTABILITY_AND_QUALITY_GATES.md`, `PROMPT_PIPELINE.md`, prompt files, eval files | Prevents prompt drift and requires AI safety/eval accountability. |
| Evidence/manual validation | `ACCOUNTABILITY_AND_QUALITY_GATES.md`, Active release evidence doc, `SLICE_MAP.md`, relevant UI/API docs | Records what was actually verified, waived, closed, or remains pending. |
| Docs/protocol | `DOC_NAVIGATION.md`, `LOW_REASONING_DEV_PROTOCOL.md`, `ACCOUNTABILITY_AND_QUALITY_GATES.md`, `SLICE_TEMPLATE.md`, affected slice briefs | Keeps docs executable rather than expanding context burden. |

---

## 4. Brief-Level Navigation Requirement

Every active brief must include a `Context Navigation` section with this shape:

```markdown
## Context Navigation

Read in this order:

1. `docs/DOC_NAVIGATION.md` - prevents broad context loading.
2. `docs/LOW_REASONING_DEV_PROTOCOL.md` - execution rules and stop conditions.
3. `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md` - debt, drift, waiver, and risk gates.
4. `docs/SLICE_MAP.md` - confirms current status and blockers.
5. `[specific doc]` - [why this doc matters for this task].
6. `[specific source file]` - [why this file is touched or inspected].

Do not read:

- `[doc]` unless [condition].
```

A brief that only lists filenames without reasons is incomplete.

---

## 5. Escalation Rule For Missing Context

If an implementation agent cannot answer one of these from the brief, it must stop and update the brief before coding:

- Which files are allowed to change?
- Which docs explain the decision?
- Which UI states are required?
- Which API/data contracts are touched?
- Which manual checks are required?
- What should not be built?
- What is the rollback or fallback path?

---

## 6. Current Priority Correction

The latest auth review found that Slice 3.5 added provider plumbing but did not fully specify the auth user experience:

- Google sign-in visibility depends on env vars but the docs did not force manual visibility checks.
- The authenticated shell does not clearly show which account is signed in.
- Non-Google email/password registration is schema-provisioned but not specified as an executable, safe registration flow.

This is now tracked as a retroactive auth realignment brief:

```text
docs/slices/SLICE_3_5_1_AUTH_REALIGNMENT_BRIEF.md
```

Do not implement the parent brief directly. Use the child briefs in order:

```text
docs/slices/SLICE_3_5_1A_ACCOUNT_VISIBILITY_BRIEF.md
docs/slices/SLICE_3_5_1B_LOGIN_VISIBILITY_BRIEF.md
docs/slices/SLICE_3_5_1C_EMAIL_REGISTRATION_PROVISIONING_BRIEF.md
```

Do not implement broader account features until the relevant child brief defines the user flow, provisioning contract, security constraints, and validation gates.
