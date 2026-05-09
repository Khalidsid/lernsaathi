/**
 * Slice 3.7: Decision Planner
 *
 * This module implements the decision-planning stage that sits between classification
 * and response generation. It loads learner context and produces a TurnDecision that
 * routes to the appropriate module-specific responder.
 *
 * Pipeline flow:
 * 1. Classify input (existing)
 * 2. Load learner context (this module)
 * 3. Plan decision (this module)
 * 4. Build response (existing, enhanced to consume decision)
 * 5. Build verification (existing)
 */

import { db } from "@/lib/db";
import { logPipelineEvent } from "@/lib/logging";
import {
  type TurnDecision,
  type LearnerContext,
  type LearningModule,
  MODULE_ROUTING_RULES,
  getDefaultDepth,
  getMemoryAction,
  isLearningModule,
} from "@/lib/decision-contract";
import type { ClassifierResult } from "@/lib/pipeline/classifier";

/**
 * Loads learner context for decision planning
 *
 * This includes:
 * - Recent learning events (last 10)
 * - Active mistakes (up to 25)
 * - Due revision cards (up to 10)
 * - Learner profile
 * - Exam readiness map
 */
export async function loadLearnerContext(userId: string): Promise<LearnerContext> {
  const [recentEvents, activeMistakes, dueRevisionCards, profile, examMap] = await Promise.all([
    // Recent learning events (last 10 for pattern detection)
    db.learningEvent.findMany({
      where: { userId },
      select: {
        id: true,
        inputType: true,
        rawInput: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),

    // Active mistakes (for prior mistake detection)
    db.mistake.findMany({
      where: {
        userId,
        status: "active",
      },
      select: {
        id: true,
        mistakeType: true,
        subtype: true,
        exampleInput: true,
        correctForm: true,
        priority: true,
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),

    // Due revision cards (for suggesting review)
    db.revisionItem.findMany({
      where: {
        mistake: {
          userId,
        },
        nextReview: {
          lte: new Date(),
        },
      },
      select: {
        id: true,
        front: true,
        back: true,
        nextReview: true,
      },
      orderBy: { nextReview: "asc" },
      take: 10,
    }),

    // Learner profile
    db.learnerProfile.findUnique({
      where: { userId },
      select: {
        displayName: true,
        germanLevel: true,
        examGoalInternal: true,
        showExamLabelsToLearner: true,
      },
    }),

    // Exam readiness map
    db.examReadinessMap.findUnique({
      where: { userId },
      select: {
        skills: true,
      },
    }),
  ]);

  return {
    recentEvents,
    activeMistakes,
    dueRevisionCards,
    profile: profile ?? null,
    examReadiness: (examMap?.skills as Record<string, unknown>) ?? {},
  };
}

/**
 * Finds prior mistakes related to the current input
 *
 * Used to determine if a simple word/phrase query should be upgraded to
 * guided explanation depth.
 */
function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/ß/g, "ss")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function inputLooksLikeLemma(input: string): boolean {
  return input.trim().length > 1 && !input.includes("?") && input.trim().split(/\s+/).length <= 3;
}

function findRelatedMistakes(
  context: LearnerContext,
  input: string,
  inputType: string,
): LearnerContext["activeMistakes"] {
  // Only search for word/phrase queries that look like lemmas
  if ((inputType !== "word_query" && inputType !== "phrase_query") || !inputLooksLikeLemma(input)) {
    return [];
  }

  const needle = normalizeSearchText(input);

  return context.activeMistakes
    .filter((mistake) => {
      const haystack = normalizeSearchText(
        [mistake.exampleInput, mistake.correctForm, mistake.subtype ?? ""].join(" "),
      );
      return haystack.includes(needle);
    })
    .slice(0, 3);
}

/**
 * Determines the learner need (human-readable intent)
 *
 * This is logged internally and can inform response generation.
 */
function inferLearnerNeed(
  classifier: ClassifierResult,
  input: string,
  relatedMistakes: LearnerContext["activeMistakes"],
): string | null {
  if (relatedMistakes.length > 0) {
    return `Reviewing prior mistake pattern: ${relatedMistakes[0].mistakeType}`;
  }

  switch (classifier.inputType) {
    case "word_query":
      return `Wants to know the meaning/usage of: ${input.slice(0, 50)}`;
    case "phrase_query":
      return `Wants to understand the phrase: ${input.slice(0, 50)}`;
    case "grammar_question":
      return `Confused about grammar pattern or rule`;
    case "sentence_correction":
      return `Wants correction and explanation for sentence`;
    case "out_of_scope":
      return "Request outside current learning scope";
    default:
      return null;
  }
}

/**
 * Determines real-world context lens
 *
 * Suggests where this pattern might appear in daily life.
 */
function inferRealWorldLens(classifier: ClassifierResult): string | null {
  // Simple heuristic based on task type
  if (classifier.taskType?.includes("work")) {
    return "workplace communication, job applications";
  }
  if (classifier.taskType?.includes("family")) {
    return "family conversations, personal relationships";
  }
  if (classifier.taskType?.includes("daily")) {
    return "daily routines, shopping, appointments";
  }

  // Default to null for now; future iterations can be smarter
  return null;
}

/**
 * Determines exam lens (internal only)
 *
 * Maps to exam-relevant skill areas without exposing pressure-heavy labels.
 */
function inferExamLens(classifier: ClassifierResult): string | null {
  if (classifier.hiddenExamRelevance && classifier.hiddenExamRelevance.length > 0) {
    return classifier.hiddenExamRelevance.join(", ");
  }
  return null;
}

/**
 * Determines suggested next action
 *
 * Based on module and learner context, suggests what the learner should do next.
 */
function determineNextAction(
  module: LearningModule,
  context: LearnerContext,
  relatedMistakes: LearnerContext["activeMistakes"],
): TurnDecision["nextAction"] {
  // If grammar/sentence correction, offer chhota check
  if (module === "grammar_question" || module === "sentence_correction") {
    return "chhota_check";
  }

  // If there are due revision cards, suggest review
  if (context.dueRevisionCards.length > 0 && module !== "revision_attempt") {
    return "review_due_card";
  }

  // If related mistakes exist and this is a lookup, suggest micro practice
  if (relatedMistakes.length > 0 && (module === "word_query" || module === "phrase_query")) {
    return "micro_practice";
  }

  // Default: no specific next action
  return "none";
}

/**
 * Determines decision confidence
 *
 * High confidence for well-supported input types, medium for ambiguous,
 * low for edge cases.
 */
function determineConfidence(
  classifier: ClassifierResult,
  module: LearningModule,
  relatedMistakes: LearnerContext["activeMistakes"],
): TurnDecision["confidence"] {
  // Out of scope is always high confidence (we're confident it's out of scope)
  if (module === "out_of_scope") {
    return "high";
  }

  // Related mistakes boost confidence
  if (relatedMistakes.length > 0) {
    return "high";
  }

  // Grammar and sentence correction with structured diagnosis
  if (module === "grammar_question" || module === "sentence_correction") {
    return "high";
  }

  // Word/phrase queries are typically high confidence
  if (module === "word_query" || module === "phrase_query") {
    return "high";
  }

  // Default to medium for other cases
  return "medium";
}

/**
 * Plans the turn decision
 *
 * This is the core decision-planning stage that produces a TurnDecision object
 * for consumption by module-specific responders.
 */
export async function planTurnDecision(
  input: string,
  classifier: ClassifierResult,
  context: LearnerContext,
): Promise<TurnDecision> {
  const startTime = Date.now();

  // Map input type to learning module
  const module: LearningModule = MODULE_ROUTING_RULES[classifier.inputType] ?? "out_of_scope";

  if (!isLearningModule(module)) {
    logPipelineEvent("decision_planner_fallback_to_out_of_scope", {
      inputType: classifier.inputType,
      unmappedModule: module,
    });
  }

  // Find related mistakes
  const relatedMistakes = findRelatedMistakes(context, input, classifier.inputType);
  const hasPriorMistakes = relatedMistakes.length > 0;

  // Determine response depth (with prior mistake upgrade)
  const responseDepth = getDefaultDepth(module, hasPriorMistakes);

  // Determine memory action
  const memoryAction = getMemoryAction(module);

  // Infer learner context
  const learnerNeed = inferLearnerNeed(classifier, input, relatedMistakes);
  const realWorldLens = inferRealWorldLens(classifier);
  const examLens = inferExamLens(classifier);

  // Determine next action
  const nextAction = determineNextAction(module, context, relatedMistakes);

  // Determine confidence
  const confidence = determineConfidence(classifier, module, relatedMistakes);

  const decision: TurnDecision = {
    inputType: classifier.inputType,
    module,
    responseDepth,
    learnerNeed,
    realWorldLens,
    examLens,
    memoryAction,
    nextAction,
    confidence,
  };

  const elapsedMs = Date.now() - startTime;

  logPipelineEvent("decision_planned", {
    module,
    responseDepth,
    memoryAction,
    nextAction,
    confidence,
    hasPriorMistakes,
    relatedMistakeCount: relatedMistakes.length,
    dueRevisionCount: context.dueRevisionCards.length,
    elapsedMs,
  });

  return decision;
}

/**
 * Convenience function to load context and plan decision in one call
 */
export async function loadContextAndPlanDecision(
  input: string,
  classifier: ClassifierResult,
  userId: string,
): Promise<{ decision: TurnDecision; context: LearnerContext }> {
  const context = await loadLearnerContext(userId);
  const decision = await planTurnDecision(input, classifier, context);
  return { decision, context };
}
