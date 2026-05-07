# Visual Integration Notes

## Source files used
- `docs/design_concept/Lernsaathi.html` - visual source of truth.
- `docs/design_concept/IMPLEMENTATION_PROMPT.md` - read for component dictionary and copy discipline only.
- `docs/design_concept/tweaks-panel.jsx` - read as design-time utility; not ported to runtime.

## Architectural directives rejected from IMPLEMENTATION_PROMPT.md
- `SQLite via Prisma` - rejected because production runs Postgres on Railway; switching would destroy persistence.
- `AUTH_USERNAME` / `AUTH_PASSWORD_HASH` env vars - rejected because seeded login already uses `ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH`.
- Four-table schema (`Mistake`, `Message`, `Event`, `UserProfile`) - rejected because it replaces the six-table schema locked by Slice 0.
- `Message` table - rejected because `LearningEvent` already stores raw input and response.
- `Event` generic table - rejected because structured `LearningEvent` columns are needed by later diagnostic logic.
- Removal of `RevisionItem` - rejected because Slice 3 depends on it for scheduling.
- Removal of `ExamReadinessMap` - rejected because hidden skill tracking is core product state.
- `AssistantResponse` replacing the existing response shape - partially rejected; `structured` was added as a render hint, while `response`, `learnerVisibleLabel`, `diagnosis`, and `suggestedVerification` stay.
- Functional `Dohraana` and `Galtiyan` tabs in v1 - rejected because Slice 3 owns the data wiring.
- Spaced-repetition algorithm - rejected for this pass because it belongs to Slice 3.
- `tweaks-panel.jsx` as runtime code - rejected because it is design-time scaffolding.

## Design HTML deviations
- Runtime does not port `.phone`, `.statusbar`, or canvas-only scaffolding, per the visual integration prompt.
- `learnerVisibleLabel` values remain sourced from `lib/pipeline/labels.ts`; design HTML lowercase labels are typography references only.
- Modal actions use the Hinglish voice-bank copy `Abhi nahi` and `Aage badhein`, preserving the Slice 1 name-modal protocol.
- `/admin/stats` keeps a hidden JSON block for the Slice 1 admin data contract while visually rendering the five design stat cards.
- Recent admin rows are derived from `LearningEvent`; no generic `Event` table was added.
- `Dohraana` and `Galtiyan` render calm placeholders instead of the 6.4/6.5 functional screens because those are deferred to Slice 3.
- The design HTML's image upload is represented by `ImageChip` and composer attach styling only; no backend upload was added.

## Components built
- `AppShell` - authenticated shell with `Lernsaathi` wordmark, menu button, and tab pills; maps to `// 6.3a` and the `// 9` shell pattern.
- `TabBar` - `Baatcheet`, `Dohraana`, `Galtiyan` active-state pills from `// 6.4` and `// 6.5`.
- `Composer` - input, attach button, and send button from `// 6.3a` and `// 6.6`.
- `UserBubble` - right-aligned user bubble from `// 9.01`.
- `AssistantBlock` - assistant response card with label tag, lemma, examples, and notes from `// 6.3b` and `// 9.02`.
- `LemmaAnchor` - Fraunces lemma with `.lemma-underline` from `// 9.04`.
- `BilingualPair` - German/Hinglish pair with 2px teal rule from `// 9.03`.
- `StatusDot` - open, in revision, settled teal-family states from `// 9.05`.
- `RevisionCard` - visual-only card from `// 6.4`.
- `MistakeRow` - visual-only row from `// 6.5`.
- `ImageChip` - pre-send image chip from `// 6.6`.
- `AdminStatCard` - operator stat card from `// 6.7`.

## Schema changes
- Added `LearningEvent.structured Json?` to persist optional assistant render hints.
- Added `LearningEvent.imagePath String?` as a reserved nullable field for Slice 4 image work.
- Migration: `prisma/migrations/20260507041803_add_visual_render_hints/migration.sql`.

## Prompt changes
- `prompts/response_word_query.md` now instructs the responder to emit `structured` as a mirror of the markdown answer.
- `prompts/response_phrase_query.md` now instructs the responder to emit `structured` as a mirror of the markdown answer.
- No changes were made to `system_core.md`, `classifier.md`, `style_guide_hinglish.md`, or `few_shot_word_phrase.md` for this pass.

## Verification evidence
- `npm run typecheck`: pass.
- `npm run lint`: pass.
- `npm run check:policy`: pass.
- `npm run eval`: pass; all 8 golden examples returned `structured` payloads.
- `npm run build`: pass; the build script now runs `prisma generate && next build` so Railway generates Prisma Client during deploy.
- Fresh database authenticated checks: pass locally with temporary audit password hash.
- Name modal: popup showed on first login, `Khalid` saved, popup did not show on second login, database showed `displayName = "Khalid"` and `loginCount = 2`.
- `die Leistung`: authenticated chat rendered the structured response and created a `LearningEvent` row with `structured.lemma.word = "Leistung"`, token counts, `verificationUsed = false`, and `mistakeCreated = false`.
- Out-of-scope request: returned the fixed Hinglish refusal; logs showed `pipeline_out_of_scope_short_circuit` after the classifier and no responder call.
- Unauthenticated `/api/chat`: returned `401`.
- Rate limit: repeated unauthenticated `/api/chat` requests returned `429`.
- Daily spend cap: with `DAILY_SPEND_CAP_USD=0.001`, returned `Aaj ka limit khatam ho gaya hai. Kal try karein.`, logged `pipeline_daily_limit_short_circuit`, and wrote zero token counts.
- `/admin/stats`: rendered behind auth with the five stat cards, recent event rows, and the existing JSON data shape.
- GitHub handoff: visual integration commit `c57758e` and Prisma build fix commit `04a96d3` are pushed to `origin/main`.
- Railway public smoke: unauthenticated `POST https://lernsaathi-production.up.railway.app/api/chat` returned `401 {"error":"Unauthorized"}` on 2026-05-07.
- Railway production login: verified working after the production migration ran.
- Railway production prompt pipeline: real authenticated queries `fliesend` and `sich vorstellen` executed through classifier, responder, OpenAI, structured response parsing, and `AssistantBlock` rendering.
- Railway production visual system: dark mode, lemma underline gradient, bilingual left rule, assistant/user bubble contrast, italic `Wörter verstehen` label, and active `Baatcheet` tab rendered intact.
- Railway production Hinglish voice: formal aap-form held in the observed responses, with no tum-form leakage or praise filler.
- Railway production nuance: typo input `fliesend` returned normalized `fließend`; `sich vorstellen` returned both meanings and the case-pattern distinction.
- Railway remaining spot-checks: query production `LearningEvent.structured` for exact persisted lemma values, and re-open production `/admin/stats` after the public chat events.

## What was NOT built (deferred)
- Dohraana tab data wiring - Slice 3.
- Galtiyan tab data wiring - Slice 3.
- Image upload backend - Slice 4.
- RevisionCard data wiring - Slice 3.
- MistakeRow data wiring - Slice 3.
