# Slice 4 Entry Criteria

**Source:** Extracted from `RETROSPECTIVE_ARCHITECTURAL_ANALYSIS.md` section 15
**Purpose:** Production gates that must pass before starting image input feature
**Status:** Active blocker - DO NOT start Slice 4 until these are satisfied or waived

---

## Required Before Slice 4

Slice 4 image input must not start until these are true or explicitly waived:

- [ ] Route-level loading and error boundaries exist.
- [ ] API validation pattern exists.
- [ ] Error envelope exists for current chat/revision routes.
- [ ] Distributed or deployment-appropriate rate limiting is decided.
- [ ] Data governance doc exists.
- [ ] OpenAI safety identifier decision is implemented or waived.
- [ ] Accessibility and e2e smoke tooling exists.
- [ ] Learning state count bug is fixed.
- [ ] UX architecture doc exists.
- [ ] Slice 4 brief exists and covers upload failure, file size, file type, image privacy, mobile capture, retry, deletion, and safety behavior.

---

## Additional Gates Required in Slice 4

Slice 4 must include these gates as part of implementation:

- File type validation.
- File size validation.
- Upload timeout handling.
- Upload retry behavior.
- Image deletion/retention policy.
- Vision prompt eval cases.
- Harmful image/content handling.
- Mobile camera/upload testing.
- Storage access control.

---

## Waiver Process

If any entry criterion cannot be met, follow this process:

1. Document the blocker in `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md`.
2. Explain why the gate cannot be satisfied.
3. Propose a mitigation or alternative.
4. Get explicit human approval before proceeding.
5. Record the waiver decision with justification.

**DO NOT** silently skip gates or mark them complete without evidence.

---

## Verification

Before marking Slice 4 as ready to start:

- Run `npm run verify` (added in Slice 3.10).
- Check `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md` for unresolved P0 debt.
- Confirm all entry criteria checkboxes above are checked or waived.
- Confirm Slice 4 brief exists and addresses all required additional gates.
