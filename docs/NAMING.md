# Naming Conventions

**Purpose:** Reduce per-file invention and make lower-reasoning edits safer.

---

## 1. Boolean State

Use prefixes:

- `is`
- `has`
- `can`
- `should`
- `will`

Use:

- `isLoading`
- `isPending`
- `isDisabled`
- `hasError`
- `canSubmit`

Avoid:

- `loading`
- `pending`
- `disabled`
- `error` when it stores a boolean

Exception:

- If a public component prop already uses `disabled`, keep it for HTML compatibility, but derive `isDisabled` internally.

---

## 2. Error State

Use:

- `errorMessage` for displayable string.
- `errorCode` for machine-readable code.
- `hasError` for boolean.

Avoid:

- `error` with unclear type in new code.

---

## 3. Event Props

Use `on` + domain action:

- `onSubmit`
- `onSend`
- `onReview`
- `onReveal`
- `onClose`
- `onRetry`

Avoid:

- `handleSubmit` as a prop name.
- `submitHandler`.
- Domain-ambiguous names such as `onReply` for form submit unless preserving existing API.

Internal functions may use `handle`:

- `handleSubmit`
- `handleRetry`

---

## 4. API Error Codes

Use snake_case:

- `bad_request`
- `validation_failed`
- `unauthorized`
- `forbidden`
- `not_found`
- `rate_limited`
- `idempotency_conflict`
- `daily_limit_reached`
- `upstream_unavailable`
- `internal_error`

Do not invent new API error codes without documenting them.

---

## 5. Test Names

Use behavior names:

- `chat rejects empty input`
- `revision review does not double count pending request`
- `name prompt reports save failure`

Avoid implementation-only names:

- `route test 1`
- `button click test`

---

## 6. Prompt And Schema Names

Prompt files:

- `response_word_query.md`
- `response_phrase_query.md`
- `response_sentence_correction.md`

Schema names:

- Use slice or feature prefix.
- Use stable names when changing internals but not response shape.
- Version the name when output shape changes materially.

Examples:

- `slice_two_lookup_responder`
- `slice_two_diagnostic_responder`
- `slice_four_image_description_v1`

---

## 7. File Names

React components:

- PascalCase component file names in `components/`.
- Route files follow Next.js conventions.

Docs:

- Use uppercase for project governance docs: `UX_ARCHITECTURE.md`.
- Use slice notes as `SLICE_N_NAME_NOTES.md`.
- Use slice briefs as `docs/slices/SLICE_N_BRIEF.md`.

