# Definition of Done

**Source:** Extracted from `RETROSPECTIVE_ARCHITECTURAL_ANALYSIS.md` section 11
**Purpose:** Quality gates that must pass before marking a slice complete
**Status:** Active governance - applies to all slices

---

## All Slices

- Typecheck passes.
- Lint passes.
- Unit tests pass where logic changed.
- Build passes.
- No unrelated files are changed.
- No TODOs without debt-register entry.
- Docs updated.
- Rollback or mitigation path exists.

---

## UI Slices

- Loading state exists.
- Empty state exists.
- Error state exists.
- Success or saved state exists.
- Disabled state is meaningful.
- Keyboard path tested.
- Focus states visible.
- Modal/menu focus behavior defined.
- Mobile 375px viewport checked.
- Dark and light themes checked.
- Reduced motion behavior checked.
- Axe scan passes for touched flow, or exceptions are documented.

---

## API Slices

- Request validation uses schema, not casts only.
- Malformed JSON returns controlled `400`.
- Auth and ownership checks exist.
- Rate limit behavior is documented.
- Idempotency behavior is documented where mutation can be retried.
- Error envelope is consistent.
- Logs avoid raw sensitive input.
- Tests cover valid request, invalid request, unauthorized, not found, and retry/conflict where relevant.

---

## Database Slices

- Migration exists.
- Backward compatibility is considered.
- Indexes match query patterns.
- Cascading delete behavior is decided.
- Retention implications are documented.
- Seed data remains valid.

---

## AI / Prompt Slices

- Prompt file changes are reviewed.
- Structured output schema changes are versioned.
- Eval cases are added or updated.
- Out-of-scope behavior is tested.
- Safety/adversarial cases are considered.
- Model and cost impact are documented.
- Any model change includes comparison evidence.

---

## Release Closure

- Production smoke test passes where deployment is involved.
- Known limitations are not hidden in slice notes.
- P0 debt is not carried forward without explicit waiver.
