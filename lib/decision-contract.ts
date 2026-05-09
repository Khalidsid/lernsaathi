/**
 * Slice 3.6: Learning Decision Contract
 *
 * This module defines the contract that turns learner input into a controlled
 * decision before response generation. The decision engine (Slice 3.7) will
 * consume this contract to route to module-specific responders.
 *
 * Design principle: Automation owns structure, memory, timing, safety, and progress.
 * The LLM owns nuance, explanation, examples, and flexible feedback inside a controlled module.
 */

/**
 * Supported learning modules
 *
 * Each module represents a distinct pedagogical interaction pattern with its own
 * response contract, depth rules, and memory behavior.
 */
export const LEARNING_MODULES = [
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
] as const;

export type LearningModule = (typeof LEARNING_MODULES)[number];

/**
 * Response depth levels
 *
 * - quick_answer: Direct lookup or simple response (word/phrase queries, out-of-scope)
 * - guided_explanation: Diagnostic response with examples and patterns (grammar, sentence correction)
 * - full_diagnostic: Reserved for future deep diagnostic flows
 */
export type ResponseDepth = "quick_answer" | "guided_explanation" | "full_diagnostic";

/**
 * Memory actions
 *
 * Determines what persistence action should follow the learner's turn.
 */
export type MemoryAction = "none" | "create_mistake" | "update_mistake" | "schedule_revision";

/**
 * Next actions
 *
 * Suggests what the learner should do after receiving the response.
 */
export type NextAction =
  | "none"
  | "chhota_check"
  | "micro_practice"
  | "review_due_card"
  | "show_pattern";

/**
 * Decision confidence
 *
 * Indicates the decision engine's confidence in the routing and module selection.
 */
export type DecisionConfidence = "high" | "medium" | "low";

/**
 * Turn Decision Contract
 *
 * Every learner turn should produce this decision object before the final response
 * is generated. The decision planner (Slice 3.7) will:
 * 1. Load learner context (recent events, active mistakes, due revision cards, profile)
 * 2. Classify the input
 * 3. Produce this decision
 * 4. Route to the appropriate module-specific responder
 */
export type TurnDecision = {
  /** Classified input type (from existing classifier) */
  inputType: string;

  /** Selected learning module */
  module: LearningModule;

  /** Response depth */
  responseDepth: ResponseDepth;

  /** Learner need (human-readable intent) */
  learnerNeed: string | null;

  /** Real-world context lens (when applicable) */
  realWorldLens: string | null;

  /** Exam-relevant context (internal only, not exposed to learner) */
  examLens: string | null;

  /** Memory action to perform after response */
  memoryAction: MemoryAction;

  /** Suggested next action */
  nextAction: NextAction;

  /** Decision confidence */
  confidence: DecisionConfidence;
};

/**
 * Module-specific response contract
 *
 * Each module can define its own response shape. This type captures the common
 * structure that all module responses should include.
 */
export type ModuleResponse = {
  /** The module that generated this response */
  module: LearningModule;

  /** The response text (markdown, Hinglish + German) */
  response: string;

  /** Learner-visible label */
  learnerVisibleLabel: string;

  /** Response depth */
  responseDepth: ResponseDepth;

  /** Structured content (optional, for UI rendering hints) */
  structured?: Record<string, unknown> | null;

  /** Verification prompt (chhota check question, if applicable) */
  verificationPrompt?: string | null;

  /** Mistake candidates (for persistence after response) */
  mistakeCandidates?: unknown[];

  /** Prior mistakes that influenced this response */
  priorMistakeReviewIds?: string[];
};

/**
 * Learner context snapshot
 *
 * The decision planner loads this context before making routing decisions.
 * This ensures prior mistakes, due revision, and profile preferences influence
 * module selection and depth.
 */
export type LearnerContext = {
  /** Recent learning events */
  recentEvents: Array<{
    id: string;
    inputType: string;
    rawInput: string;
    createdAt: Date;
  }>;

  /** Active mistakes */
  activeMistakes: Array<{
    id: string;
    mistakeType: string;
    subtype: string | null;
    exampleInput: string;
    correctForm: string;
    priority: string;
  }>;

  /** Due revision cards */
  dueRevisionCards: Array<{
    id: string;
    front: string;
    back: string;
    nextReview: Date;
  }>;

  /** Learner profile */
  profile: {
    displayName: string | null;
    germanLevel: string;
    examGoalInternal: string;
    showExamLabelsToLearner: boolean;
  } | null;

  /** Exam readiness map (current skill levels) */
  examReadiness: Record<string, unknown>;
};

/**
 * Module routing rules
 *
 * Maps input types to learning modules. This is a deterministic mapping that
 * the decision planner uses to select the appropriate module.
 */
export const MODULE_ROUTING_RULES: Record<string, LearningModule> = {
  word_query: "word_query",
  phrase_query: "phrase_query",
  grammar_question: "grammar_question",
  sentence_correction: "sentence_correction",
  revision_attempt: "revision_attempt",
  mistake_practice: "mistake_practice",
  writing_support: "writing_support",
  exam_task_decoding: "exam_task_decoding",
  image_description: "image_description",
  out_of_scope: "out_of_scope",
};

/**
 * Depth routing rules
 *
 * Determines default response depth based on module and learner context.
 * These rules can be overridden if prior mistakes are found.
 */
export function getDefaultDepth(
  module: LearningModule,
  hasPriorMistakes: boolean,
): ResponseDepth {
  // Prior mistakes always upgrade to guided explanation
  if (hasPriorMistakes) {
    return "guided_explanation";
  }

  switch (module) {
    case "word_query":
    case "phrase_query":
    case "out_of_scope":
      return "quick_answer";

    case "grammar_question":
    case "sentence_correction":
    case "mistake_practice":
    case "revision_attempt":
      return "guided_explanation";

    case "writing_support":
    case "exam_task_decoding":
    case "image_description":
      return "guided_explanation";

    default:
      return "quick_answer";
  }
}

/**
 * Memory action rules
 *
 * Determines what memory action should occur based on module and input type.
 */
export function getMemoryAction(module: LearningModule): MemoryAction {
  switch (module) {
    case "grammar_question":
    case "sentence_correction":
      return "create_mistake";

    case "revision_attempt":
      return "update_mistake";

    case "mistake_practice":
      return "schedule_revision";

    case "word_query":
    case "phrase_query":
    case "writing_support":
    case "exam_task_decoding":
    case "image_description":
    case "out_of_scope":
      return "none";

    default:
      return "none";
  }
}

/**
 * Validates that a module is supported
 */
export function isLearningModule(value: string): value is LearningModule {
  return LEARNING_MODULES.includes(value as LearningModule);
}
