# Prompt Pipeline

## Stage 1: Classifier
- Reads raw learner input.
- Produces `inputType`, `taskType`, `hiddenExamRelevance`, and `depthHint`.
- Slice 1 only supports `word_query`, `phrase_query`, and `out_of_scope`.

## Stage 2: Responder
- Builds the learner-facing Hinglish answer.
- Uses shared system rules, the style guide, a task-specific response prompt, and the few-shot examples.
- Returns the response text, learner label, and diagnosis hints.

## Stage 3: Verifier
- Present in code now, but returns `null` in slice 1.
- This keeps the pipeline shape stable for slice 2, when quick checks and mistake creation begin.

## Why it stays split
- The classifier and responder have different jobs and different output contracts.
- Logging and future mistake memory depend on stage-level outputs, not only on the final answer.

## Decision Engine Layer (Slice 3.6+)

### Current Status (Slice 3.6 Complete)
- Slice 3.6 defines the `TurnDecision` contract in `lib/decision-contract.ts`.
- 10 learning modules formalized: `word_query`, `phrase_query`, `grammar_question`, `sentence_correction`, `revision_attempt`, `mistake_practice`, `writing_support`, `exam_task_decoding`, `image_description`, `out_of_scope`.
- Each decision includes: module, response depth, learner need, real-world context, exam context, memory action, next action, and confidence.
- Routing rules map input types to modules deterministically.
- Depth logic upgrades word/phrase queries to guided_explanation when prior mistakes exist.
- Memory action rules specify when to create mistakes, update mistakes, or schedule revision.
- Unit tests verify all routing and decision logic (`tests/unit/decision-contract.test.ts`).

### Planned (Slice 3.7)
- Implement the decision planner function that loads learner context and produces `TurnDecision`.
- Insert decision planning stage between classifier and responder.
- The intended flow becomes: **classifier → learner context lookup → decision planner → module-specific responder → verifier/practice action → logging**.
- Module-specific responders consume the decision contract instead of improvising behavior.
- LLM remains responsible for explanation, nuance, and examples, but not for routing or scheduling.

### Design Principle
**Automation owns**: structure, memory, timing, safety, and progress.
**LLM owns**: nuance, explanation, examples, and flexible feedback inside a controlled module.
