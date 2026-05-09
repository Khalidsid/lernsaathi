# Architecture

## Stack
- Next.js 15 App Router with TypeScript and Tailwind.
- Postgres via Prisma.
- NextAuth v5 credentials flow with one seeded user.
- OpenAI via the `openai` npm package.
- Pino for structured console logging.

## Why all schema tables exist in slice 0
- `User`, `LearnerProfile`, and `ExamReadinessMap` are needed immediately for auth, name capture, and later skill tracking.
- `LearningEvent` is the slice-1 source of truth for logging, spend tracking, and later diagnostics.
- `Mistake` and `RevisionItem` are intentionally present early because slices 2 and 3 depend on their identifiers, taxonomy, and relations. Adding them later would force avoidable migration churn.

## Exam readiness map shape
```json
{
  "grammar_accuracy": {
    "articles": "unknown",
    "cases": "unknown",
    "word_order": "unknown",
    "verb_forms": "unknown",
    "connectors": "unknown"
  },
  "vocabulary": {
    "household": "unknown",
    "work": "unknown",
    "appointments": "unknown",
    "travel": "unknown",
    "health": "unknown"
  },
  "text_understanding": {
    "task_instruction_decoding": "unknown",
    "main_idea_detection": "unknown",
    "detail_detection": "unknown",
    "vocabulary_in_context": "unknown"
  },
  "audio_understanding": {
    "time_signal_detection": "unknown",
    "action_detection": "unknown",
    "reason_detection": "unknown",
    "speaker_intention": "unknown"
  },
  "writing": {
    "situation_understanding": "unknown",
    "formal_email_structure": "unknown",
    "point_coverage": "unknown",
    "register_control": "unknown",
    "simple_sentence_accuracy": "unknown"
  },
  "speaking": {
    "self_introduction": "unknown",
    "picture_description": "unknown",
    "opinion_with_reason": "unknown",
    "planning_dialogue": "unknown",
    "question_response": "unknown"
  }
}
```

## Pipeline rationale
- The runtime is intentionally split into classifier, decision-planner, responder, and verifier stages.
- Slice 1 keeps verifier as a stub, but the function boundary is already in place.
- Slice 3.7 adds the decision-planner stage between classification and response generation.
- Decision planner loads learner context (recent events, active mistakes, due revision cards, profile, exam readiness) and produces a `TurnDecision` object.
- The `TurnDecision` maps input types to learning modules, determines response depth (with prior mistake upgrades), selects memory actions, and suggests next actions.
- This keeps later slices from turning one oversized prompt into a refactor problem and enables systematic routing to module-specific response contracts.

## Prompt-file convention
- Prompts live in `prompts/` and are loaded from disk at runtime.
- System prompts are never inlined in TypeScript strings.
- Slice-1 responder behavior is composed from `system_core.md`, `style_guide_hinglish.md`, the task-specific response file, and the few-shot file.

## Eval convention
- `eval/golden/word_phrase_v1.jsonl` stores the eight reference examples from the brief.
- `npm run eval` calls the live model, compares outputs with the golden references, and runs negative checks for formality drift, mixed glosses, and forbidden learner-facing exam vocabulary.

## Formality decision
- The app uses formal aap-form Hinglish everywhere learner-facing.
- The prompts reinforce this, and the eval script checks outputs for drift.

## Display name rule
- Slice 1 captures `displayName`.
- Slice 2 uses the name only at `guided_explanation` depth for genuinely tricky grammar or sentence-correction moments.
- The name is used at most once per assistant turn, at the start of a sentence.
- The name is never injected into routine word or phrase responses, and never into a meaning gloss line.
- Null `displayName` is valid and must render without placeholders.

## Dependency notes
- `bcryptjs` is used instead of native `bcrypt` to keep Railway deployment simpler while still validating bcrypt-format password hashes.
- OpenAI daily spend checks use the current `LearningEvent` token history and a fixed GPT-5 price estimate in code. If model pricing changes, update `lib/openai.ts`.
- `lucide-react` is used for the visual integration icon contract from `docs/design_concept/Lernsaathi.html`.
- `npm run build` runs `prisma generate && next build` so Railway deployments do not fail with a missing Prisma Client.

## Auth Direction
- Current implementation supports NextAuth Credentials as a fallback and Google OAuth when `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are configured.
- Google access is allowlisted through `GOOGLE_ALLOWED_EMAILS`; open registration is not supported.
- Slice 3.5 is implemented locally and added idempotency guards plus per-user rate limiting for current chat/attempt/revision routes.
- Known limitation: rate limiting still uses in-memory state and is not suitable for multi-instance deployments until Slice 3.12 replaces or waives it.
- Do not treat the app as ready for open registration, broad multi-user public access, or durable distributed abuse controls until the Slice 3.12 reliability baseline lands.

## Visual System
- Design source of truth: `docs/design_concept/Lernsaathi.html`.
- Component dictionary: `components/` (see `docs/VISUAL_INTEGRATION_NOTES.md` for the `// 9.x` mapping).
- Design tokens: `tailwind.config.ts` and `app/globals.css`, ported from the `<style>` and `tailwind.config` blocks of the design HTML.
- Structured render hints: `AssistantResponse.structured` is optional and mirrors the markdown response, letting components render lemma anchors and bilingual pairs without parsing markdown client-side.
- Label values come from `lib/pipeline/labels.ts`. Design HTML strings are visual reference only; `labels.ts` is data truth.
- Tabs `Revise` and `Mistakes` are data-backed from Slice 3 onward. Revise reads due `RevisionItem` rows; Mistakes reads persisted `Mistake` rows.
- UI chrome copy decision after inspection: the design HTML's default `bilingual` voice bank uses English chrome for tabs and action buttons (`Chat`, `Revise`, `Mistakes`, `Sign in`, `Continue`, `Skip`, `Show`). Learner-facing content remains formal aap-form Hinglish plus German.

## Frontend persistence boundary
- Every `/api/chat` call persists a `LearningEvent` row.
- The visible message list hydrates recent history from `LearningEvent` rows through `lib/chat-history.ts`.
- New messages still append optimistically in the client, but refresh should restore recent persisted turns.

## Chat shell interaction invariants
- The authenticated chat UI behaves like a chat application, not a long scrolling webpage.
- The app shell owns the fixed viewport region, using dynamic viewport height semantics such as `h-dvh` / `min-h-dvh`.
- TopBar, MessageStream, Composer, and OverflowMenu are distinct UI regions.
- TopBar and Composer are stable chrome and must remain visible during normal chat use.
- MessageStream is the independent scroll container for long conversations.
- Browser/body/page scrolling must not be required to reach the composer or keep using chat.
- Composer contains only input-related controls. The attach icon is disabled until Slice 4 implements real image upload/capture; it must not stage dummy files.
- Theme, logout, navigation, settings, and future history controls do not live inside Composer.
- The three-dot button opens OverflowMenu only. It must not directly log the user out.
- OverflowMenu contains explicit menu actions, including theme control and a separate `Sign out` action.
- Composer focus states must use Lernsaathi design tokens and remain keyboard-visible in light and dark modes. Browser/default orange or red focus outlines are not allowed.
- Mobile layouts must respect safe-area bottom padding so the composer and latest message are not hidden.
- Pending chat requests render a temporary assistant placeholder (`Soch raha hoon...`) in the MessageStream and replace it with the response or existing error surface.

## Slice 2 Label Routing
- Templated out-of-scope responses use `getLearnerVisibleLabelForEvent("out_of_scope")`, which always returns `Aufgabe verstehen`.
- Templated daily-limit responses use `getLearnerVisibleLabelForEvent("daily_limit_reached")`, which returns `Wörter verstehen` because the learner's original task is still a word or phrase lookup even though the cap blocked the answer.
- Both templated refusal paths are logged with `responseDepth = quick_answer`; guided explanation depth is reserved for real diagnostic responses.

## Slice 2 Diagnostic Loop
- Adaptive depth routing lives in `lib/pipeline/depth.ts`. Word and phrase lookups stay `quick_answer` unless a matching active mistake is found; grammar questions and sentence correction cap at `guided_explanation`.
- The verifier is active only for guided grammar and sentence-correction responses. It reads `prompts/verifier_chhota_check.md` and returns one short chhota-check question; quick answers and templated refusals skip it.
- Mistake creation happens after the `LearningEvent` is written in `app/api/chat/route.ts`, through `lib/pipeline/mistakes.ts`. It only runs for `grammar_question` and `sentence_correction`, skips duplicate active or settled items, writes locked `MISTAKE_TYPES`, and never creates rows for word or phrase lookups.
- Mistake priority is deterministic in `lib/pipeline/mistake_priority.ts`: fundamentals and repeated types are high, most items are medium, register-only items are low.
- Pattern A is rendered by `ReflectionCard`, `AttemptInput`, `GhostRevealLink`, and `ChhotaCheck`. The state is driven by `AssistantResponse.structured.reflection`; the reveal is client-only, while attempt replies post to `/api/chat/attempt`.
- Attempt feedback uses `prompts/response_attempt_feedback.md` through `lib/pipeline/attempt_feedback.ts`, so follow-up replies still use the prompt pipeline and log token counts.
- ExamReadinessMap updates run through `lib/pipeline/exam_map.ts`; only dot-path skill keys such as `grammar_accuracy.cases` are bumped from `unknown` to `weak`.
- Prior-mistake awareness uses normalized local matching over active mistakes. When a lookup matches, the responder gets a prior-note injection, the response depth becomes `guided_explanation`, a visible `pehle` reminder is guaranteed, and the matched mistake's `reviewCount` / `lastReviewedAt` are updated.

## Slice 3 Revision Loop
- New mistakes create one `RevisionItem` through `lib/revision-data.ts`, using the existing Slice 0 schema.
- Active mistakes that predate Slice 3 are backfilled with missing revision items when the Revise tab loads.
- Revise tab shows due `RevisionItem` rows where `nextReview <= now` and the source mistake is still active.
- Review actions post to `POST /api/revision/review`.
- `Again` keeps the interval at 1 day, lowers ease slightly, and does not count toward settling.
- `Got it` increases ease, grows the interval up to 14 days, and settles the source mistake after three successful reviews.
- Mistakes tab groups persisted `Mistake` rows by recency and maps active/reviewed/settled state onto the existing teal status dots.

## Decision Contract (Slice 3.6)
- Slice 3.6 defines the `TurnDecision` contract that formalizes how learner input becomes a controlled decision.
- The contract types live in `lib/decision-contract.ts` with full TypeScript enforcement.
- 10 learning modules are defined: `word_query`, `phrase_query`, `grammar_question`, `sentence_correction`, `revision_attempt`, `mistake_practice`, `writing_support`, `exam_task_decoding`, `image_description`, `out_of_scope`.
- Each turn decision specifies: module, response depth (quick_answer | guided_explanation | full_diagnostic), memory action (none | create_mistake | update_mistake | schedule_revision), and next action.
- Decision logic considers learner context: recent events, active mistakes, due revision cards, profile, and exam readiness.
- Prior mistakes upgrade word/phrase queries from quick_answer to guided_explanation automatically.
- Unit tests in `tests/unit/decision-contract.test.ts` prove all routing rules and depth logic work correctly.

## Future Slice Direction
- Future prompt-level implementation guidance lives in `docs/build_prompts/future_slice_prompts.md`.
- The retrospective note for this roadmap shift lives in `docs/SLICE_3_RETROSPECTIVE_ROADMAP_RESTRUCTURE_NOTES.md`.
- The realignment control plan lives in `docs/RETROSPECTIVE_ARCHITECTURAL_ANALYSIS.md`.
- The low-reasoning execution protocol lives in `docs/LOW_REASONING_DEV_PROTOCOL.md`.
- UI/design contracts live in `docs/UX_ARCHITECTURE.md`, `docs/COMPONENT_CONTRACTS.md`, and `docs/NAMING.md`.
- Future slice briefs live in `docs/slices/`.
- The roadmap inserts Slice 3.6-3.13 between auth hardening and image input so the app does not jump from basic memory into broad multimodal features without a stronger learning engine and production baseline.
- Slice 3.6 (implemented locally): defines the decision contract types, modules, and routing rules.
- Slice 3.7 (implemented locally): implements the first decision engine, inserting decision planning between classifier and responder, loading learner context, and routing to module-specific responders.
- Slice 3.8 (implemented locally): exposes learning momentum in the UI through next actions, due counts, active mistake counts, stronger empty states, and visible saved/scheduled feedback.
- Slice 3.9 (implemented locally): deepens the revision and mistake-practice loop before image, writing, picture-description, reading/listening, speaking, and personal-story modules expand the product surface.
- Slice 3.10 (planned): adds framework loading/error boundaries and executable gates.
- Slice 3.11 (planned): establishes low-reasoning UI contracts and accessibility baseline.
- Slice 3.12 (planned): establishes API validation, error envelope, privacy, reliability, and AI safety/model policy.
- Slice 3.13 (planned): fixes evidence and debt gaps before Slice 4.

## Development Control Protocol
- Future tasks should not require a model to infer the whole architecture from scattered docs.
- Use `docs/LOW_REASONING_DEV_PROTOCOL.md` to define the exact context pack, allowed files, non-goals, steps, validation commands, and stop conditions.
- Use `docs/slices/SLICE_TEMPLATE.md` for every new slice brief.
- For UI work, use `docs/UX_ARCHITECTURE.md` and `docs/COMPONENT_CONTRACTS.md` as the immediate source of truth.
- Use exact status words in `docs/SLICE_MAP.md`: planned, implemented locally, verified locally, manual evidence pending, production smoke passed, complete, waived.
