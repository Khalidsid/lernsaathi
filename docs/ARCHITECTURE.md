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
- Slice 1 captures `displayName` only.
- The name is not injected into routine word or phrase responses.
- Future slices may use the name only in genuinely difficult diagnostic moments.

## Dependency notes
- `bcryptjs` is used instead of native `bcrypt` to keep Railway deployment simpler while still validating bcrypt-format password hashes.
- OpenAI daily spend checks use the current `LearningEvent` token history and a fixed GPT-5 price estimate in code. If model pricing changes, update `lib/openai.ts`.
- `lucide-react` is used for the visual integration icon contract from `docs/design_concept/Lernsaathi.html`.

## Visual System
- Design source of truth: `docs/design_concept/Lernsaathi.html`.
- Component dictionary: `components/` (see `docs/VISUAL_INTEGRATION_NOTES.md` for the `// 9.x` mapping).
- Design tokens: `tailwind.config.ts` and `app/globals.css`, ported from the `<style>` and `tailwind.config` blocks of the design HTML.
- Structured render hints: `AssistantResponse.structured` is optional and mirrors the markdown response, letting components render lemma anchors and bilingual pairs without parsing markdown client-side.
- Label values come from `lib/pipeline/labels.ts`. Design HTML strings are visual reference only; `labels.ts` is data truth.
- Tabs `Dohraana` and `Galtiyan` are visual placeholders in this pass; data wiring lands in Slice 3.
