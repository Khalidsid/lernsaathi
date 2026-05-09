/**
 * Slice 3.6: Decision Contract Unit Tests
 *
 * Tests the decision contract types, module routing rules, and depth/memory logic.
 */

import { strict as assert } from "node:assert";
import {
  LEARNING_MODULES,
  MODULE_ROUTING_RULES,
  getDefaultDepth,
  getMemoryAction,
  isLearningModule,
  type LearningModule,
  type TurnDecision,
} from "../../lib/decision-contract.ts";

function testModuleDefinitions() {
  console.log("Testing module definitions...");

  // Test that all required modules are defined
  const expectedModules: LearningModule[] = [
    "word_query",
    "phrase_query",
    "grammar_question",
    "sentence_correction",
    "revision_attempt",
    "mistake_practice",
    "writing_support",
    "exam_task_decoding",
    "image_description",
    "out_of_scope",
  ];

  assert.equal(
    LEARNING_MODULES.length,
    expectedModules.length,
    "Should have all 10 modules defined",
  );

  for (const module of expectedModules) {
    assert.ok(
      LEARNING_MODULES.includes(module),
      `Module ${module} should be in LEARNING_MODULES`,
    );
  }

  console.log("✓ Module definitions test passed");
}

function testModuleRouting() {
  console.log("Testing module routing rules...");

  // Test that input types map to correct modules
  assert.equal(MODULE_ROUTING_RULES.word_query, "word_query");
  assert.equal(MODULE_ROUTING_RULES.phrase_query, "phrase_query");
  assert.equal(MODULE_ROUTING_RULES.grammar_question, "grammar_question");
  assert.equal(MODULE_ROUTING_RULES.sentence_correction, "sentence_correction");
  assert.equal(MODULE_ROUTING_RULES.out_of_scope, "out_of_scope");

  console.log("✓ Module routing test passed");
}

function testDepthRouting() {
  console.log("Testing depth routing logic...");

  // Word and phrase queries without prior mistakes -> quick_answer
  assert.equal(
    getDefaultDepth("word_query", false),
    "quick_answer",
    "Word query without prior mistakes should be quick_answer",
  );
  assert.equal(
    getDefaultDepth("phrase_query", false),
    "quick_answer",
    "Phrase query without prior mistakes should be quick_answer",
  );

  // Grammar and sentence correction -> guided_explanation
  assert.equal(
    getDefaultDepth("grammar_question", false),
    "guided_explanation",
    "Grammar question should be guided_explanation",
  );
  assert.equal(
    getDefaultDepth("sentence_correction", false),
    "guided_explanation",
    "Sentence correction should be guided_explanation",
  );

  // Prior mistakes upgrade word/phrase to guided_explanation
  assert.equal(
    getDefaultDepth("word_query", true),
    "guided_explanation",
    "Word query with prior mistakes should upgrade to guided_explanation",
  );
  assert.equal(
    getDefaultDepth("phrase_query", true),
    "guided_explanation",
    "Phrase query with prior mistakes should upgrade to guided_explanation",
  );

  // Out of scope -> quick_answer
  assert.equal(
    getDefaultDepth("out_of_scope", false),
    "quick_answer",
    "Out of scope should be quick_answer",
  );

  console.log("✓ Depth routing test passed");
}

function testMemoryActions() {
  console.log("Testing memory action rules...");

  // Grammar and sentence correction create mistakes
  assert.equal(
    getMemoryAction("grammar_question"),
    "create_mistake",
    "Grammar question should create mistake",
  );
  assert.equal(
    getMemoryAction("sentence_correction"),
    "create_mistake",
    "Sentence correction should create mistake",
  );

  // Revision attempt updates mistake
  assert.equal(
    getMemoryAction("revision_attempt"),
    "update_mistake",
    "Revision attempt should update mistake",
  );

  // Mistake practice schedules revision
  assert.equal(
    getMemoryAction("mistake_practice"),
    "schedule_revision",
    "Mistake practice should schedule revision",
  );

  // Word/phrase queries don't create mistakes
  assert.equal(
    getMemoryAction("word_query"),
    "none",
    "Word query should have no memory action",
  );
  assert.equal(
    getMemoryAction("phrase_query"),
    "none",
    "Phrase query should have no memory action",
  );

  // Out of scope has no memory action
  assert.equal(
    getMemoryAction("out_of_scope"),
    "none",
    "Out of scope should have no memory action",
  );

  console.log("✓ Memory action test passed");
}

function testModuleValidation() {
  console.log("Testing module validation...");

  // Valid modules
  assert.ok(isLearningModule("word_query"), "word_query should be valid");
  assert.ok(isLearningModule("grammar_question"), "grammar_question should be valid");
  assert.ok(isLearningModule("out_of_scope"), "out_of_scope should be valid");

  // Invalid modules
  assert.ok(!isLearningModule("invalid_module"), "invalid_module should not be valid");
  assert.ok(!isLearningModule(""), "empty string should not be valid");
  assert.ok(!isLearningModule("word"), "partial match should not be valid");

  console.log("✓ Module validation test passed");
}

function testDecisionContract() {
  console.log("Testing decision contract type...");

  // Test that TurnDecision can be constructed with all required fields
  const decision: TurnDecision = {
    inputType: "word_query",
    module: "word_query",
    responseDepth: "quick_answer",
    learnerNeed: "Wants to know the meaning of 'die Leistung'",
    realWorldLens: "school, work performance",
    examLens: "vocabulary.work",
    memoryAction: "none",
    nextAction: "none",
    confidence: "high",
  };

  assert.equal(decision.module, "word_query");
  assert.equal(decision.responseDepth, "quick_answer");
  assert.equal(decision.memoryAction, "none");

  // Test with prior mistake routing
  const grammarDecision: TurnDecision = {
    inputType: "grammar_question",
    module: "grammar_question",
    responseDepth: "guided_explanation",
    learnerNeed: "Confused about Wechselpräposition (wo vs wohin)",
    realWorldLens: "location descriptions, directions",
    examLens: "grammar_accuracy.cases",
    memoryAction: "create_mistake",
    nextAction: "chhota_check",
    confidence: "high",
  };

  assert.equal(grammarDecision.module, "grammar_question");
  assert.equal(grammarDecision.memoryAction, "create_mistake");
  assert.equal(grammarDecision.nextAction, "chhota_check");

  console.log("✓ Decision contract test passed");
}

function testPriorMistakeInfluence() {
  console.log("Testing prior mistake influence on decisions...");

  // Simulate word query with prior mistake
  const module: LearningModule = "word_query";
  const hasPriorMistake = true;

  const depth = getDefaultDepth(module, hasPriorMistake);

  assert.equal(
    depth,
    "guided_explanation",
    "Prior mistake should upgrade word query to guided_explanation",
  );

  console.log("✓ Prior mistake influence test passed");
}

function testOutOfScopeRouting() {
  console.log("Testing out-of-scope routing...");

  const module: LearningModule = "out_of_scope";
  const depth = getDefaultDepth(module, false);
  const memoryAction = getMemoryAction(module);

  assert.equal(depth, "quick_answer", "Out of scope should be quick_answer");
  assert.equal(memoryAction, "none", "Out of scope should have no memory action");

  console.log("✓ Out-of-scope routing test passed");
}

// Run all tests
console.log("\n=== Decision Contract Tests ===\n");

testModuleDefinitions();
testModuleRouting();
testDepthRouting();
testMemoryActions();
testModuleValidation();
testDecisionContract();
testPriorMistakeInfluence();
testOutOfScopeRouting();

console.log("\n✅ All decision contract tests passed\n");
