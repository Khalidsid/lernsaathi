# Slice Map

| # | Name | What it adds |
|---|---|---|
| 0 | Foundation | Scaffold, full schema, auth, OpenAI wrapper, prompt pipeline shape, logging |
| 1 | Word & phrase queries | Single text input, classifier-lite, Hinglish response, event logging |
| 1.5 | Visual Integration | Apply design system from Lernsaathi.html to existing slice 1 surfaces; build component dictionary; add tab placeholders |
| 2 | Grammar Q & sentence correction | Full classifier, adaptive depth router, verifier, mistake creation; local complete 2026-05-08, Railway route smoke verified |
| 2.5 | Chat UI Stabilization Patch | Safe overflow menu, Light/Dark/System theme control, fixed chat viewport, internal message scrolling, composer focus correction, pending assistant placeholder, desktop visual tightening |
| 3 | Mistake memory & revision queue | DB-backed chat hydration, revision scheduling, daily review UI, real mistake list |
| 3.5 | Auth & Session Hardening | Google OAuth allowlist, preserve existing user data, future password-account provisions, idempotency and concurrency guards |
| 3.6 | Learning Decision Contract | Typed turn-decision contract, module list, response contracts, learner-context routing rules |
| 3.7 | Decision Engine V1 | Deterministic decision-planning stage, module-specific response contracts, one targeted next action |
| 3.8 | Learning Momentum UI | Today state, due/active counts, better empty states, quick-start actions, visible saved/scheduled feedback |
| 3.9 | Revision & Mistake Practice Upgrade | Revision progress, due reasons, richer review feedback, mistake detail and targeted practice |
| 4 | Image input | File upload, vision, multi-exercise handling |
| 5 | Writing prompts | Scaffolded writing support |
| 6 | Picture description | Observation-first guidance |
| 7 | Reading/listening question decoding | Task phrase decoding and answer strategy |
| 8 | Speaking practice | Text-only speaking support |
| 9 | Personal-story to German | Guided narrative conversion |
| 10 | Hidden exam-readiness map | Internal skill-level updates and insights |
| 11 | Polish & PWA | Installability, offline queue, export, theming |

## Current Status
- Slice 0 + Slice 1: live in production; login, migrations, real prompt-pipeline calls, OpenAI responses, and structured rendering are working.
- Slice 1.5 Visual Integration: live in production; design tokens, dark mode, assistant blocks, lemma underline, bilingual pairs, and tab shell are rendering correctly.
- Slice 2: complete locally; diagnostic classifier, adaptive depth, chhota-check verifier, Pattern A, Mistake writes, prior-mistake awareness, and attempt feedback pass local checks.
- Production smoke: Railway public `POST /api/chat` returns the expected unauthenticated `401`; new Slice 2 `POST /api/chat/attempt` also returns `401`, confirming the new route is live.
- Local dev auth: username `admin`, password `testpass123`; the prior failure was a local bcrypt hash mismatch, not production credentials being requested.
- Remaining evidence follow-up: authenticated production behavior walk, production `LearningEvent.structured` DB spot-check, first production `Mistake` row, and production `/admin/stats` spot-check.
- Pairing protocol: developer owns visual/browser validation and production DB evidence; Codex records unavailable evidence as pending instead of changing code to manufacture a minor validation pass.
- Frontend persistence note: visible chat history now hydrates from persisted `LearningEvent` rows.
- UI chrome decision: English tabs/actions from the design HTML default voice bank are intended (`Chat`, `Revise`, `Mistakes`, `Sign in`, `Continue`, `Skip`, `Show`). Slice 3 updates the tab labels to `Chat`, `Revise`, and `Mistakes`.
- Slice 2.5: complete locally on 2026-05-09. It fixes chat shell behavior, safe menu/theme controls, composer focus, pending state, and visual width. It does not implement DB-backed conversation history.
- Slice 3: complete locally on 2026-05-09. It wires DB-backed chat hydration, revision cards, review scheduling, and the real mistake list. A full collapsible conversation/history panel remains out of scope.
- Slice 3.5: complete locally on 2026-05-09. It implements Google OAuth with email allowlist, preserves existing user data via email mapping, adds request idempotency for chat/attempt/revision routes, guards mistake and revision item creation against duplicates, and implements per-user rate limiting. Known limitation: rate limiting uses in-memory Map, not suitable for multi-instance deployments.
- Slice 3.6: complete locally on 2026-05-09. It defines the `TurnDecision` contract with 10 learning modules, response depth levels, memory actions, and next actions. Routing rules map input types to modules. Depth logic considers prior mistakes. Unit tests verify all decision logic. This slice creates types and tests only; Slice 3.7 will wire the decision engine into the pipeline.
- Slice 3.7-3.9: inserted after retrospective review. These slices prevent a sloppy jump into image or writing features by first implementing the decision engine, visible learning momentum, and deeper revision/mistake practice.
- Roadmap restructure note: `docs/SLICE_3_RETROSPECTIVE_ROADMAP_RESTRUCTURE_NOTES.md` records why the application behavior and UI direction shifted after Slice 3.
- Future implementation prompts: `docs/build_prompts/future_slice_prompts.md` is the prompt-level guide for Slice 3.5 through Slice 11.
- Exact latest commit is tracked by git history; this status page avoids commit hashes that go stale after doc-only updates.
