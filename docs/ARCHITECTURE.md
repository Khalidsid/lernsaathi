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
- The runtime is intentionally split into classifier, responder, and verifier stages.
- Slice 1 keeps verifier as a stub, but the function boundary is already in place.
- This keeps later slices from turning one oversized prompt into a refactor problem.

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

## Visual System
- Design source of truth: `docs/design_concept/Lernsaathi.html`.
- Component dictionary: `components/` (see `docs/VISUAL_INTEGRATION_NOTES.md` for the `// 9.x` mapping).
- Design tokens: `tailwind.config.ts` and `app/globals.css`, ported from the `<style>` and `tailwind.config` blocks of the design HTML.
- Structured render hints: `AssistantResponse.structured` is optional and mirrors the markdown response, letting components render lemma anchors and bilingual pairs without parsing markdown client-side.
- Label values come from `lib/pipeline/labels.ts`. Design HTML strings are visual reference only; `labels.ts` is data truth.
- Tabs `Dohraana` and `Galtiyan` are visual placeholders in this pass; data wiring lands in Slice 3.
- UI chrome copy decision after inspection: the design HTML's default `bilingual` voice bank uses English chrome for tabs and action buttons (`Chat`, `Revise`, `Mistakes`, `Sign in`, `Continue`, `Skip`, `Show`). Learner-facing content remains formal aap-form Hinglish plus German. Current Hinglish chrome labels from the visual integration pass are a documented UI-copy mismatch, not an architectural decision.

## Frontend persistence boundary
- Every `/api/chat` call persists a `LearningEvent` row.
- The visible message list remains browser/in-memory state until Slice 3 introduces DB-backed history/revision surfaces.
- Refresh clearing the visible chat transcript is expected before Slice 3. Database rows disappearing on refresh would be a persistence bug or environment reset issue, not intended behavior.

## Chat shell interaction invariants
- The authenticated chat UI behaves like a chat application, not a long scrolling webpage.
- The app shell owns the fixed viewport region, using dynamic viewport height semantics such as `h-dvh` / `min-h-dvh`.
- TopBar, MessageStream, Composer, and OverflowMenu are distinct UI regions.
- TopBar and Composer are stable chrome and must remain visible during normal chat use.
- MessageStream is the independent scroll container for long conversations.
- Browser/body/page scrolling must not be required to reach the composer or keep using chat.
- Composer contains only input-related controls: attach, send, and staged image removal if image staging is active.
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
