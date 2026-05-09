# Prompt Pipeline

## Stage 1: Classifier
- Reads raw learner input.
- Produces `inputType`, `taskType`, `hiddenExamRelevance`, and `depthHint`.
- Slice 1 supports `word_query`, `phrase_query`, and `out_of_scope`.
- Slice 2 adds `grammar_question` and `sentence_correction`.

## Stage 2: Decision Planner (Slice 3.7+)
- Loads learner context: recent events, active mistakes, due revision cards, profile, exam readiness.
- Maps input type to learning module via `MODULE_ROUTING_RULES`.
- Finds related mistakes for word/phrase queries.
- Upgrades response depth to `guided_explanation` when prior mistakes exist.
- Determines memory action (create_mistake, update_mistake, schedule_revision, none).
- Infers learner need, real-world context, exam context.
- Suggests next action (chhota_check, review_due_card, micro_practice, none).
- Produces `TurnDecision` object consumed by responder.
- Implemented in `lib/pipeline/decision-planner.ts`.

## Stage 3: Responder
- Builds the learner-facing Hinglish answer.
- Uses shared system rules, the style guide, a task-specific response prompt, and the few-shot examples.
- Slice 3.7+: Consumes `TurnDecision` object to provide decision context to LLM.
- Returns the response text, learner label, and diagnosis hints.

## Stage 4: Verifier
- Present in code now, but returns `null` in slice 1.
- Slice 2+: Builds chhota check verification prompts for grammar/sentence correction.
- This keeps the pipeline shape stable for future enhancement.

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

### Implemented (Slice 3.7 Complete)
- Decision planner implemented in `lib/pipeline/decision-planner.ts`.
- Inserted between classifier and responder in pipeline flow.
- Current flow: **classifier → learner context lookup → decision planner → responder (consumes decision) → verifier → logging**.
- Responder receives decision context as additional system prompt content.
- Prior mistakes now reliably upgrade word/phrase queries to guided explanation depth.
- Decision metadata logged in `decision_planned` event with module, depth, memory action, next action, confidence.
- LLM remains responsible for explanation, nuance, and examples, not for routing or scheduling.

### Design Principle
**Automation owns**: structure, memory, timing, safety, and progress.
**LLM owns**: nuance, explanation, examples, and flexible feedback inside a controlled module.
