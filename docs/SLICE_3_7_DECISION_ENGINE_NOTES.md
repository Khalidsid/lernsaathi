# Slice 3.7: Decision Engine V1

**Status**: Complete locally on 2026-05-09

## What This Slice Adds

This slice implements the first production decision engine using the Slice 3.6 contract. It transforms the pipeline from "question in, LLM answer out" into a controlled decision engine where every turn produces a deliberate routing decision before response generation.

## Core Components

### 1. Decision Planner (`lib/pipeline/decision-planner.ts`)

The decision planner is the new stage inserted between classification and response generation.

**Key Functions:**
- `loadLearnerContext(userId)` - Loads complete learner context:
  - Recent 10 learning events (for pattern detection)
  - Active 25 mistakes (for prior mistake detection)
  - Due 10 revision cards (for suggesting review)
  - Learner profile (displayName, germanLevel, examGoal, preferences)
  - Exam readiness map (current skill levels)

- `planTurnDecision(input, classifier, context)` - Produces a `TurnDecision` object:
  - Maps input type to learning module via `MODULE_ROUTING_RULES`
  - Finds related mistakes (for word/phrase queries)
  - Upgrades depth to `guided_explanation` if prior mistakes exist
  - Determines memory action (create_mistake, update_mistake, schedule_revision, none)
  - Infers learner need, real-world lens, exam lens
  - Determines suggested next action (chhota_check, review_due_card, micro_practice, none)
  - Assesses decision confidence (high/medium/low)

- `loadContextAndPlanDecision(input, classifier, userId)` - Convenience wrapper

### 2. Pipeline Integration (`lib/pipeline/index.ts`)

**New Pipeline Flow:**
1. Classify input (existing)
2. **Load learner context and plan decision** (NEW - Slice 3.7)
3. Build response (enhanced to consume decision)
4. Build verification prompt (existing)
5. Return result with decision metadata

**Changes:**
- Added `import { loadContextAndPlanDecision } from "@/lib/pipeline/decision-planner"`
- Decision planner called after classification
- Decision object passed to responder
- Decision metadata included in pipeline return value

### 3. Responder Enhancement (`lib/pipeline/responder.ts`)

**Changes:**
- Added optional `decision?: TurnDecision` parameter to `buildResponse` options
- When decision available, adds decision context to system prompt:
  - Learning module
  - Learner need
  - Real-world context
  - Suggested next action
  - Hint about chhota check if applicable

**Example Decision Context Added to Prompt:**
```
Decision context (internal, for assistant reference):
- Learning module: grammar_question
- Learner need: Confused about grammar pattern or rule
- Real-world context: not specified
- Suggested next action: chhota_check
Note: Plan to offer a quick verification question after this explanation.
```

## Design Decisions

### Prior Mistake Detection

Prior mistakes are detected by:
1. Normalizing input and mistake content (lowercase, remove diacritics, collapse whitespace)
2. Searching active mistakes for matches against:
   - `exampleInput`
   - `correctForm`
   - `subtype`
3. Returning top 3 matches

**Depth Upgrade Rule:**
- If any related mistakes found for word/phrase query → upgrade to `guided_explanation`
- This ensures learners get deeper explanation for patterns they've struggled with before

### Module Routing

Direct mapping from input types to modules via `MODULE_ROUTING_RULES`:
- `word_query` → `word_query` module
- `phrase_query` → `phrase_query` module
- `grammar_question` → `grammar_question` module
- `sentence_correction` → `sentence_correction` module
- `out_of_scope` → `out_of_scope` module

Future modules (revision_attempt, mistake_practice, writing_support, etc.) are defined but not yet routed by classifier.

### Next Action Logic

**Deterministic Rules:**
1. Grammar/sentence correction always suggests `chhota_check` (verification question)
2. If due revision cards exist (and not in revision flow) → `review_due_card`
3. If related mistakes exist for word/phrase query → `micro_practice`
4. Default → `none`

### Memory Actions

**Module-Specific Rules:**
- `grammar_question`, `sentence_correction` → `create_mistake`
- `revision_attempt` → `update_mistake`
- `mistake_practice` → `schedule_revision`
- All others → `none`

### Decision Confidence

**High Confidence:**
- Out-of-scope inputs (confident it's out of scope)
- Related mistakes found (strong context signal)
- Grammar/sentence correction (structured diagnostic flow)
- Word/phrase queries (well-supported module)

**Medium Confidence:**
- All other cases

**Low Confidence:**
- Reserved for future ambiguous cases

## Logging and Observability

**New Pipeline Events:**
- `decision_planned` - Logged after decision object created with:
  - module
  - responseDepth
  - memoryAction
  - nextAction
  - confidence
  - hasPriorMistakes
  - relatedMistakeCount
  - dueRevisionCount
  - elapsedMs

- Enhanced `pipeline_out_of_scope_short_circuit` with decision metadata
- Enhanced `pipeline_response_complete` with decision metadata

## Backward Compatibility

**Maintained:**
- Prior mistakes still extracted via `findOpenMistakesForInput` (legacy path)
- Both decision-planner's prior mistake detection AND legacy path run in parallel
- This ensures existing responder prompts continue to work as expected

**Future Cleanup:**
- Once decision-planner is proven stable, can remove legacy `findOpenMistakesForInput`
- Can rely solely on decision-planner's related mistake detection

## Testing

**Unit Tests:**
- Existing decision-contract tests cover routing rules, depth logic, memory actions
- No new unit tests added for decision-planner (relies on integration behavior)

**Integration Testing:**
- Typecheck passes
- Lint passes
- Unit tests pass
- Ready for eval testing

## Known Limitations

1. **RevisionItem Query:** Currently queries revision items via mistake relation. This works but could be optimized with a direct userId index if performance becomes an issue.

2. **Exam Readiness:** Currently loads exam readiness map but doesn't deeply influence routing yet. Future slices can enhance this.

3. **Decision Metadata Persistence:** Decision object is returned in pipeline result but not yet persisted to `LearningEvent.structured`. Can be added if needed for analytics.

4. **Module Coverage:** Only 5 modules currently routable (word_query, phrase_query, grammar_question, sentence_correction, out_of_scope). Future slices will activate remaining 5 modules.

## Acceptance Criteria

✅ Existing word/phrase queries still answer directly
✅ Grammar and sentence correction still trigger diagnostic loop
✅ Prior related mistakes reliably influence depth (upgrade to guided_explanation)
✅ Out-of-scope input remains cheap and controlled
✅ Decision object is logged and inspectable
✅ Typecheck, lint, and unit tests pass
✅ App never returns blank/generic failure when classification succeeds

## Next Steps

**Slice 3.8 (Learning Momentum UI):**
- Surface decision metadata in UI (next action hints, due revision prompts)
- Use decision confidence to show learner feedback
- Display learning state (due count, active mistake count, today's progress)

**Slice 3.9 (Revision & Mistake Practice Upgrade):**
- Activate `revision_attempt` and `mistake_practice` modules
- Implement richer review options using decision engine
- Use decision object to drive review feedback

**Future Module Activation:**
- Slice 4: Activate `image_description` module
- Slice 5: Activate `writing_support` and `exam_task_decoding` modules
