# Slice 3.6 Decision Contract Notes

## Status
Implemented locally on 2026-05-09. Decision contract types, module definitions, routing rules, and unit tests are implemented. Slice 3.7 will implement the actual decision engine that uses this contract.

## Why this slice exists
The app currently uses a simple classifier → responder flow. Before adding image upload, writing modules, and other learning modes, we need a formal contract that:
1. Routes inputs to appropriate learning modules
2. Considers learner context (prior mistakes, due revision, profile)
3. Determines response depth, memory actions, and next actions
4. Separates automation concerns (routing, memory, progress) from LLM concerns (explanation, nuance, examples)

## Design Principle
**Automation owns**: structure, memory, timing, safety, and progress tracking.
**LLM owns**: nuance, explanation, examples, and flexible feedback inside a controlled module.

## Core Contract: TurnDecision

Every learner turn should produce a `TurnDecision` object before the response is generated:

```typescript
type TurnDecision = {
  inputType: string;                    // From existing classifier
  module: LearningModule;              // Selected learning module
  responseDepth: ResponseDepth;        // quick_answer | guided_explanation | full_diagnostic
  learnerNeed: string | null;          // Human-readable intent
  realWorldLens: string | null;        // Real-world context (e.g., "work emails, appointments")
  examLens: string | null;             // Exam-relevant context (internal only)
  memoryAction: MemoryAction;          // none | create_mistake | update_mistake | schedule_revision
  nextAction: NextAction;              // none | chhota_check | micro_practice | review_due_card | show_pattern
  confidence: DecisionConfidence;      // high | medium | low
};
```

## Supported Learning Modules

1. **word_query** - Single word lookups (article, meaning, plural, examples)
2. **phrase_query** - Multi-word phrase lookups
3. **grammar_question** - Grammar explanations and concept clarification
4. **sentence_correction** - Sentence-level diagnostic correction with Pattern A
5. **revision_attempt** - Learner attempting a revision card answer
6. **mistake_practice** - Targeted practice for a specific mistake
7. **writing_support** - Scaffolded writing assistance (planned for Slice 5)
8. **exam_task_decoding** - Task instruction understanding (planned for Slice 7)
9. **image_description** - Visual input description (planned for Slice 6)
10. **out_of_scope** - Non-learning requests or off-topic input

## Response Depth Levels

### quick_answer
- Direct lookups without deep explanation
- Word/phrase queries without prior mistakes
- Out-of-scope refusals
- No verification or follow-up practice

### guided_explanation
- Diagnostic responses with examples and patterns
- Grammar questions and sentence correction
- Word/phrase queries when prior mistakes exist
- Includes verification (chhota check) when appropriate

### full_diagnostic
- Reserved for future deep diagnostic flows
- Not currently used in Slice 3.6

## Memory Actions

| Memory Action | When Used | Effect |
|--------------|-----------|--------|
| `none` | Word/phrase queries, out-of-scope | No persistence |
| `create_mistake` | Grammar questions, sentence correction | Creates Mistake row if not duplicate |
| `update_mistake` | Revision attempts | Updates reviewCount, lastReviewedAt |
| `schedule_revision` | Mistake practice | Creates or updates RevisionItem |

## Next Actions

| Next Action | When Suggested | User Experience |
|------------|---------------|-----------------|
| `none` | Simple lookups, out-of-scope | No follow-up prompt |
| `chhota_check` | After guided grammar/correction | Verification question |
| `micro_practice` | After mistake review | Practice similar pattern |
| `review_due_card` | When due revision cards exist | Prompt to visit Revise tab |
| `show_pattern` | After repeated mistakes | Display common pattern |

## Module Routing Rules

Input types map deterministically to modules:

```typescript
word_query → word_query
phrase_query → phrase_query
grammar_question → grammar_question
sentence_correction → sentence_correction
revision_attempt → revision_attempt
out_of_scope → out_of_scope
```

Future input types (writing, image, exam task) will map to their respective modules when implemented.

## Depth Routing Logic

### Default Depth (no prior mistakes):
- **word_query, phrase_query, out_of_scope** → quick_answer
- **grammar_question, sentence_correction** → guided_explanation
- **revision_attempt, mistake_practice** → guided_explanation

### Prior Mistake Influence:
If active mistakes match the current input, depth upgrades to `guided_explanation` regardless of module.

## Learner Context

The decision planner (Slice 3.7) will load this context before making decisions:

```typescript
type LearnerContext = {
  recentEvents: Array<{ id, inputType, rawInput, createdAt }>;
  activeMistakes: Array<{ id, mistakeType, exampleInput, priority }>;
  dueRevisionCards: Array<{ id, front, back, nextReview }>;
  profile: { displayName, germanLevel, examGoalInternal, showExamLabelsToLearner };
  examReadiness: Record<string, unknown>;
};
```

This ensures:
- Prior mistakes influence routing and depth
- Due revision cards can be suggested as next actions
- Profile preferences control exam-label visibility
- Recent events prevent redundant explanations

## Implementation Files

### Core Contract
- `lib/decision-contract.ts` - Types, modules, routing rules, depth logic, memory actions

### Tests
- `tests/unit/decision-contract.test.ts` - Unit tests for all routing and decision logic

### Future Implementation (Slice 3.7)
- `lib/pipeline/decision-planner.ts` - Will load learner context and produce TurnDecision
- `lib/pipeline/modules/` - Module-specific responders
- Updated `lib/pipeline/index.ts` - Insert decision planning stage

## Existing Flow Still Works

This slice **only adds types and tests**. The existing Slice 2 and Slice 3 flows remain unchanged:
- Classifier still produces inputType
- Responder still generates responses
- Verifier still creates chhota checks
- Mistakes and revision items still persist correctly

Slice 3.7 will wire the decision contract into the pipeline.

## Acceptance Criteria Met

✅ Typed decision contract exists (`TurnDecision`)
✅ All 10 learning modules defined
✅ Response depth, memory action, and next action types defined
✅ Module routing rules map input types to modules
✅ Depth routing considers prior mistakes
✅ Memory action rules map modules to persistence behavior
✅ Unit tests cover all routing and decision logic
✅ Existing Slice 2/3 flows remain intact
✅ Real-world and exam context fields exist (internal only)

## Testing Evidence

```bash
$ node --experimental-strip-types tests/unit/decision-contract.test.ts

=== Decision Contract Tests ===

✓ Module definitions test passed
✓ Module routing test passed
✓ Depth routing test passed
✓ Memory action test passed
✓ Module validation test passed
✓ Decision contract test passed
✓ Prior mistake influence test passed
✓ Out-of-scope routing test passed

✅ All decision contract tests passed
```

## What's Next (Slice 3.7)

Slice 3.7 will:
1. Create the decision planner function
2. Load learner context before response generation
3. Insert decision planning between classifier and responder
4. Use module-specific response contracts
5. Log decision metadata in LearningEvent
6. Make routing deterministic and testable

The decision contract is now ready for implementation.
