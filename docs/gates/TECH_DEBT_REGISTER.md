# Technical Debt Register

**Source:** Extracted from `RETROSPECTIVE_ARCHITECTURAL_ANALYSIS.md` section 12
**Purpose:** Tracks architecture/quality debt discovered during retrospective
**Status:** Active - operational tracking lives in `ACCOUNTABILITY_AND_QUALITY_GATES.md`

---

## About This Register

This retrospective register explains the source debt discovered during the architectural analysis. Operational debt tracking, ownership, waivers, drift reports, and closure evidence now live in `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md`.

This register supersedes vague "deferred" notes. Every item needs a priority and action.

---

## Priority Definitions

- **P0**: Blocks Slice 4 or production readiness.
- **P1**: Should be fixed before broad user testing.
- **P2**: Valuable but not blocking.
- **P3**: Nice-to-have or likely never needed.

---

## Debt Items

| Item | Priority | Evidence | Recommended Action |
|---|---|---|---|
| No route `loading.tsx` / `error.tsx` | P0 | App Router conventions absent. | Add in Slice 3.10. |
| In-memory rate limiting | P0 | `lib/ratelimit.ts` uses `Map`. | Replace with shared store or document single-instance waiver. |
| Missing API validation | P0 | Routes cast JSON bodies directly. | Add zod schemas and safe JSON parsing. |
| No privacy/retention policy | P0 | Learner raw input and responses stored indefinitely. | Create data governance doc and deletion/export procedure. |
| No automated a11y/e2e gates | P0 | Tooling not configured. | Add Playwright and axe checks. |
| Inaccurate `todayReviews` metric | P0 | Learning state counts events not written by revision route. | Write review event or add review table. |
| Auth UX and account provisioning gap | P0 | Google OAuth is wired, but account identity is not visible after login and non-Google registration is only schema-provisioned. | Complete Slice 3.5.1 before treating auth as product-grade. |
| No OpenAI safety identifier | P1 | `responses.create` does not pass `safety_identifier`. | Add hashed user identifier. |
| No model upgrade policy | P1 | `OPENAI_MODEL = "gpt-5"` alias. | Define alias/snapshot strategy. |
| Missing observability hook | P1 | No `instrumentation.ts`. | Add Next instrumentation and request ids. |
| Keyboard shortcut conflict risk | P1 | Revision listens globally. | Add text-entry guard and tests. |
| Toast component not integrated | P2 | Component exists but not used. | Wire or remove. |
| Naming inconsistencies | P2 | Callback/state names vary. | Fix opportunistically, not as broad risky refactor. |
| Storybook/component docs | P2 | No component catalog. | Add after core gates. |
| Offline/PWA | P2 | Currently planned for Slice 11. | Limit offline to revision/cache unless chat offline is feasible. |
| Celebration animations/streaks | P3 | Product polish only. | Do not schedule until reliability is solid. |

---

## Usage Notes

- **Before starting a slice**: Check if any P0 items block the slice goal.
- **During implementation**: If new debt is discovered, add to `ACCOUNTABILITY_AND_QUALITY_GATES.md` operational ledger.
- **After completion**: Update this register if P0/P1 items are closed.
- **When prioritizing**: Use this register to justify slice ordering decisions.
