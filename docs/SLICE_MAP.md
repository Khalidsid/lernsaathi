# Slice Map

| # | Name | What it adds |
|---|---|---|
| 0 | Foundation | Scaffold, full schema, auth, OpenAI wrapper, prompt pipeline shape, logging |
| 1 | Word & phrase queries | Single text input, classifier-lite, Hinglish response, event logging |
| 1.5 | Visual Integration | Apply design system from Lernsaathi.html to existing slice 1 surfaces; build component dictionary; add tab placeholders |
| 2 | Grammar Q & sentence correction | Full classifier, adaptive depth router, verifier, mistake creation; implemented locally 2026-05-08, Railway route smoke verified |
| 2.5 | Chat UI Stabilization Patch | Safe overflow menu, Light/Dark/System theme control, fixed chat viewport, internal message scrolling, composer focus correction, pending assistant placeholder, desktop visual tightening |
| 3 | Mistake memory & revision queue | DB-backed chat hydration, revision scheduling, daily review UI, real mistake list |
| 3.5 | Auth & Session Hardening | Google OAuth allowlist, preserve existing user data, future password-account provisions, idempotency and concurrency guards |
| 3.5.1 | Auth UX & Account Provisioning Realignment | Retroactive correction for sign-in visibility, signed-in account display, and safe non-Google email/password provisioning |
| 3.6 | Learning Decision Contract | Typed turn-decision contract, module list, response contracts, learner-context routing rules |
| 3.7 | Decision Engine V1 | Deterministic decision-planning stage, module-specific response contracts, one targeted next action |
| 3.8 | Learning Momentum UI | Today state, due/active counts, better empty states, quick-start actions, visible saved/scheduled feedback |
| 3.9 | Revision & Mistake Practice Upgrade | Revision progress, due reasons, richer review feedback, mistake detail and targeted practice |
| 3.9.1 | Retroactive 3.9 Realignment | Review-count correctness, keyboard shortcut guard, learning-state a11y, evidence scaffold |
| 3.9.2 | Revision Clickability Fix | Make revision cards clickable, hover states, keyboard accessibility for card activation |
| 3.10 | Production Gates & Framework Boundaries | Route loading/error boundaries, verification script, lint gates, first e2e/a11y smoke path |
| 3.11 | UX Architecture & Accessibility Baseline | Low-reasoning UI contracts, focus/keyboard rules, mobile/a11y baseline fixes |
| 3.12 | Reliability, Safety & Privacy Baseline | API validation, error envelope, rate-limit decision, observability, data governance, OpenAI safety/model policy |
| 3.13 | Evidence Pass & Debt Triage | Manual evidence matrix, review-count correctness fix, debt register update, release evidence |
| 3.14 | Problem-First Landing Screen | Six high-gloss German/Hinglish problem tiles, compact collapsed learning coach, login redirect to dashboard |
| 3.15 | Active Learning Interaction Components | Reusable QuickCheck, ProductionPrompt, JourneyStepCard, and small reward feedback components |
| 3.16 | Problem Journey Screens | Dedicated focused journey entry screens for WOERTER, LESEN, SCHREIBEN, GRAMMATIK, HOEREN, and WIEDERHOLEN |
| 4 | Image input | File upload, vision, multi-exercise handling; integrates with Words, Scenarios, and Reading modes |
| 5 | Writing prompts | Scaffolded writing support; integrates with Writing mode and uses QuizCard for grammar checks |
| 6 | Picture description | Observation-first guidance; integrates with Scenarios and Reading modes |
| 7 | Reading/listening question decoding | Task phrase decoding and answer strategy; integrates with Reading mode |
| 8 | Speaking practice | Text-only speaking support; integrates with Scenarios mode |
| 9 | Personal-story to German | Guided narrative conversion; integrates with Writing mode |
| 10 | Hidden exam-readiness map | Internal skill-level updates and insights |
| 11 | Polish & PWA | Installability, offline queue, export, theming |

## Current Status
- Development control protocol: active. Future sessions should read `docs/DOC_NAVIGATION.md`, `docs/LOW_REASONING_DEV_PROTOCOL.md`, `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md`, `docs/SLICE_MAP.md`, and the relevant `docs/slices/SLICE_*_BRIEF.md` instead of loading every retrospective note. The active brief must state which other docs matter and why.
- Slice status words from now on: `planned`, `implemented locally`, `verified locally`, `manual evidence pending`, `production smoke passed`, `complete`, `waived`. Do not mark a slice `complete` while manual evidence is still pending.
- Slice 0 + Slice 1: production smoke passed; login, migrations, real prompt-pipeline calls, OpenAI responses, and structured rendering are working.
- Slice 1.5 Visual Integration: production smoke passed; design tokens, dark mode, assistant blocks, lemma underline, bilingual pairs, and tab shell are rendering correctly.
- Slice 2: implemented locally; diagnostic classifier, adaptive depth, chhota-check verifier, Pattern A, Mistake writes, prior-mistake awareness, and attempt feedback pass local checks.
- Production smoke: Railway public `POST /api/chat` returns the expected unauthenticated `401`; new Slice 2 `POST /api/chat/attempt` also returns `401`, confirming the new route is live.
- Local dev auth: username `admin`, password `testpass123`; the prior failure was a local bcrypt hash mismatch, not production credentials being requested.
- Remaining evidence follow-up: authenticated production behavior walk, production `LearningEvent.structured` DB spot-check, first production `Mistake` row, and production `/admin/stats` spot-check.
- Pairing protocol: developer owns visual/browser validation and production DB evidence; Codex records unavailable evidence as pending instead of changing code to manufacture a minor validation pass.
- Frontend persistence note: visible chat history now hydrates from persisted `LearningEvent` rows.
- UI chrome decision: English tabs/actions from the design HTML default voice bank are intended (`Chat`, `Revise`, `Mistakes`, `Sign in`, `Continue`, `Skip`, `Show`). Slice 3 updates the tab labels to `Chat`, `Revise`, and `Mistakes`.
- Slice 2.5: implemented locally on 2026-05-09. It fixes chat shell behavior, safe menu/theme controls, composer focus, pending state, and visual width. It does not implement DB-backed conversation history.
- Slice 3: implemented locally on 2026-05-09. It wires DB-backed chat hydration, revision cards, review scheduling, and the real mistake list. A full collapsible conversation/history panel remains out of scope.
- Slice 3.5: implemented locally on 2026-05-09 for provider plumbing and request hardening. It implements Google OAuth with email allowlist, preserves existing user data via email mapping, adds request idempotency for chat/attempt/revision routes, guards mistake and revision item creation against duplicates, and implements per-user rate limiting. Known limitations: rate limiting uses in-memory Map, not suitable for multi-instance deployments; auth UX/account provisioning is incomplete and moved to Slice 3.5.1.
- Slice 3.5.1: planned. Parent brief lives at `docs/slices/SLICE_3_5_1_AUTH_REALIGNMENT_BRIEF.md` and must be executed through child briefs `3.5.1A`, `3.5.1B`, and `3.5.1C`. It must define and implement sign-in method visibility, signed-in account display, and safe non-Google email/password registration provisioning before auth can be treated as product-grade.
- Slice 3.6: implemented locally on 2026-05-09. It defines the `TurnDecision` contract with 10 learning modules, response depth levels, memory actions, and next actions. Routing rules map input types to modules. Depth logic considers prior mistakes. Unit tests verify all decision logic. This slice creates types and tests only; Slice 3.7 wires the decision engine into the pipeline.
- Slice 3.7: implemented locally on 2026-05-09. It implements the decision-planning stage between classification and response generation. The decision planner loads learner context (recent events, active mistakes, due revision cards, profile, exam readiness), finds related mistakes, produces a `TurnDecision` object, and passes it to the responder. Prior mistakes now upgrade word/phrase queries to guided explanation depth. Decision metadata is logged and included in pipeline output. Typecheck, lint, and unit tests pass.
- Slice 3.8: implemented locally on 2026-05-09. Motion design system (8 CSS tokens, 8 animations), learning state API endpoint, LearningStatePanel with animated counts and skeleton loading, Toast component with slide-up/fade-out animations, enhanced empty states for all three tabs (quick-start chips, icons, links), AppShell integration (chat tab). Post-implementation: comprehensive language audit implemented smart bilingual strategy (English system UI, Hinglish learning content) across 10 files for user-friendly experience. Typecheck, lint, and build pass. Manual browser testing remains for final polish verification.
- Slice 3.9: implemented locally on 2026-05-09. Enhanced revision experience with progress tracking (counter + animated progress bar), 4-button review system (Again/Hard/Good/Easy) with color coding, improved spaced repetition algorithm handling all four ratings, after-review feedback showing next review timing, smooth card transitions (slide-out/slide-in animations), keyboard navigation (Space to reveal, 1-4 to rate), and visual keyboard hints. Typecheck passes. Manual browser testing recommended.
- Slice 3.9.1: verified locally on 2026-05-09. It fixes learning-state review counting (based on persisted `Mistake.lastReviewedAt`), adds a revision keyboard shortcut text-entry guard, adds low-risk learning-state ARIA metadata, and adds a release evidence scaffold at `docs/RELEASE_EVIDENCE_SLICE_3_9_1.md`. Manual browser testing remains pending. Blocks Slice 3.10 and Slice 4 until evidence is recorded.
- Slice 3.9.2: verified locally on 2026-05-10. Unrevealed revision cards are now clickable and keyboard-focusable with hover/focus states, while the existing reveal and rating flow remains unchanged. Typecheck and build pass; manual browser/mobile/dark-mode evidence remains pending. Does not block other slices.
- Slice 3.10: verified locally on 2026-05-10. Added root loading/error/not-found boundaries, `npm run verify`, React Hooks and duplicate-import lint gates, and architecture notes for deferred Playwright/axe automation. `npm run verify` passes. Playwright/axe automation remains deferred to a dedicated tooling slice because current local dependency contents are incomplete. Blocks Slice 4 until manual evidence is clean.
- Slice 3.11: implemented locally on 2026-05-11. Added skip-to-content baseline in root layout, improved overflow-menu and modal keyboard focus return/escape behavior, and strengthened learning-state accessibility naming/live-region semantics plus UX/component/naming contracts. Manual keyboard/mobile evidence remains pending. Blocks Slice 4.
- Slice 3.12: planned. Brief lives at `docs/slices/SLICE_3_12_BRIEF.md`. Blocks Slice 4.
- Slice 3.13: planned. Brief lives at `docs/slices/SLICE_3_13_BRIEF.md`. Blocks Slice 4.
- Slice 3.14: planned. Brief lives at `docs/slices/SLICE_3_14_BRIEF.md`. It is now a problem-first landing screen, not a generic mode dashboard: six high-gloss German/Hinglish task tiles (`WOERTER`, `LESEN`, `SCHREIBEN`, `GRAMMATIK`, `HOEREN`, `WIEDERHOLEN`), compact collapsed learning coach, and login/root redirect to `/dashboard`. Blocks Slice 4 because it changes entry point expectations.
- Slice 3.15: planned. Brief lives at `docs/slices/SLICE_3_15_BRIEF.md`. It creates reusable active-learning UI components (`QuickCheck`, `ProductionPrompt`, `JourneyStepCard`, `LearningReward`) without model, API, or persistence changes. Blocks Slice 3.16 journey screens.
- Slice 3.16: planned. Brief lives at `docs/slices/SLICE_3_16_BRIEF.md`. It implements focused journey entry screens one sub-slice at a time, starting with `WOERTER`; no old chat history by default, no fake media controls, no schema changes unless a separate brief is approved.
- Slice 3.7-3.9: inserted after retrospective review. These slices prevent a sloppy jump into image or writing features by first implementing the decision engine, visible learning momentum, and deeper revision/mistake practice.
- Slice 3.10-3.13: inserted after realignment review. These slices make future development feasible for lower-reasoning sessions by reducing context requirements, adding explicit UI/API contracts, and installing executable gates before broader feature work.
- Slice 3.9.2, 3.14-3.16: inserted after dashboard UX planning on 2026-05-10. User feedback identified confusion with chat-first auto-redirect and requested menu-driven dashboard with learning mode tiles. These slices implement dashboard foundation, interactive quiz components, and mode-specific UIs. See `docs/LEARNING_MODES_DASHBOARD_PLANNING.md` for full rationale and design.
- Roadmap restructure note: `docs/SLICE_3_RETROSPECTIVE_ROADMAP_RESTRUCTURE_NOTES.md` records why the application behavior and UI direction shifted after Slice 3.
- Future implementation prompts: `docs/build_prompts/future_slice_prompts.md` is now a legacy product-intent library. Active implementation starts from `docs/DOC_NAVIGATION.md`, `docs/LOW_REASONING_DEV_PROTOCOL.md`, `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md`, and the relevant `docs/slices/SLICE_*_BRIEF.md`.
- Accountability gate: `docs/ACCOUNTABILITY_AND_QUALITY_GATES.md` is the operational source for debt IDs, waivers, drift reports, changed-files audit, and safety/security/privacy/AI gates.
- Exact latest commit is tracked by git history; this status page avoids commit hashes that go stale after doc-only updates.
