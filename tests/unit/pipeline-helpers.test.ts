import assert from "node:assert/strict";

import { selectResponseDepth } from "../../lib/pipeline/depth.ts";
import { updateExamReadinessSkills } from "../../lib/pipeline/exam_map.ts";
import {
  getExamImpactForGrammarTopic,
  getMistakeTypesForGrammarTopic,
  isCoreGrammarTopic,
} from "../../lib/pipeline/grammar_topics.ts";
import { assignMistakePriority } from "../../lib/pipeline/mistake_priority.ts";
import { buildRevisionItemFromMistake, calculateNextRevisionState } from "../../lib/revision.ts";

assert.equal(selectResponseDepth("word_query", { depthHint: "quick_answer" }), "quick_answer");
assert.equal(
  selectResponseDepth("word_query", { depthHint: "quick_answer" }, [{ id: "mistake_1" }]),
  "guided_explanation",
);
assert.equal(selectResponseDepth("phrase_query", { depthHint: "quick_answer" }, [{ id: "mistake_1" }]), "guided_explanation");
assert.equal(selectResponseDepth("grammar_question", { depthHint: "full_diagnostic" }), "guided_explanation");
assert.equal(selectResponseDepth("sentence_correction", { depthHint: "full_diagnostic" }), "guided_explanation");
assert.equal(selectResponseDepth("out_of_scope", { depthHint: "guided_explanation" }), "quick_answer");
assert.equal(selectResponseDepth("daily_limit_reached", { depthHint: "guided_explanation" }), "quick_answer");

assert.equal(isCoreGrammarTopic("wechselpraepositionen"), true);
assert.equal(isCoreGrammarTopic("passive_voice"), false);
assert.deepEqual(getMistakeTypesForGrammarTopic("article_gender"), ["article_gender_confusion"]);
assert.deepEqual(getExamImpactForGrammarTopic("verb_position_v2"), [
  "grammar_accuracy.word_order",
  "writing.simple_sentence_accuracy",
]);

assert.equal(assignMistakePriority("case_confusion", 0), "high");
assert.equal(assignMistakePriority("phrase_meaning", 2), "high");
assert.equal(assignMistakePriority("formality_register_confusion", 0), "low");
assert.equal(assignMistakePriority("phrase_meaning", 0), "medium");

assert.deepEqual(
  calculateNextRevisionState({ ease: 2.5, intervalDays: 1, rating: "again", reviewCount: 1 }),
  {
    ease: 2.3,
    intervalDays: 1,
    reviewCount: 1,
    shouldSettle: false,
  },
);
assert.deepEqual(
  calculateNextRevisionState({ ease: 2.5, intervalDays: 3, rating: "good", reviewCount: 2 }),
  {
    ease: 2.6,
    intervalDays: 8,
    reviewCount: 3,
    shouldSettle: true,
  },
);
assert.deepEqual(
  buildRevisionItemFromMistake(
    {
      correctForm: "Ich gehe in die Küche.",
      exampleInput: "Ich gehe in der Küche.",
      explanationGiven: "Movement uses Akkusativ.",
      hiddenExamImpact: ["grammar_accuracy.cases"],
      mistakeType: "case_confusion",
      subtype: "movement_vs_location",
    },
    new Date("2026-05-09T00:00:00.000Z"),
  ),
  {
    revisionType: "mistake_transfer",
    front: "Ich gehe in die Küche.",
    back: "Ich gehe in die Küche.",
    explanation: "Movement uses Akkusativ.",
    hiddenExamRelevance: ["grammar_accuracy.cases"],
    learnerVisibleLabel: "Wiederholen, was schwer war",
    nextReview: new Date("2026-05-09T00:00:00.000Z"),
    intervalDays: 1,
    ease: 2.5,
  },
);

const updated = updateExamReadinessSkills(
  {
    grammar_accuracy: {
      cases: "unknown",
      word_order: "medium",
    },
    writing: {
      simple_sentence_accuracy: "unknown",
    },
  },
  ["grammar_accuracy.cases", "grammar_accuracy.word_order", "writing.simple_sentence_accuracy"],
);

assert.deepEqual(updated, {
  grammar_accuracy: {
    cases: "weak",
    word_order: "medium",
  },
  writing: {
    simple_sentence_accuracy: "weak",
  },
});

console.log("pipeline helper unit tests passed");
