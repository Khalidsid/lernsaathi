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
