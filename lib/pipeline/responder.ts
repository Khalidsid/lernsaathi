import { LEARNER_VISIBLE_LABELS } from "@/lib/pipeline/labels";
import { loadPrompt } from "@/lib/prompts";
import { runStructuredPrompt } from "@/lib/openai";
import { getMistakeTypesForGrammarTopic, isCoreGrammarTopic } from "@/lib/pipeline/grammar_topics";
import { MISTAKE_TYPES } from "@/lib/pipeline/taxonomy";

import type { ClassifierResult } from "@/lib/pipeline/classifier";
import type { ResponseDepth } from "@/lib/pipeline/depth";
import type { StructuredAssistantContent, StructuredDiagnosisItem } from "@/lib/assistant-response";
import type { MistakeType } from "@/lib/pipeline/taxonomy";

export type ResponderResult = {
  response: string;
  learnerVisibleLabel: string;
  diagnosis: string[];
  suggestedVerification: string | null;
  structured?: StructuredAssistantContent | null;
};

const lemmaSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    article: {
      type: ["string", "null"],
      enum: ["der", "die", "das", null],
    },
    word: { type: "string" },
    plural: { type: ["string", "null"] },
    gloss: { type: "string" },
  },
  required: ["article", "word", "plural", "gloss"],
} as const;

const exampleSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    de: { type: "string" },
    hi: { type: "string" },
  },
  required: ["de", "hi"],
} as const;

const responderSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    response: { type: "string" },
    learnerVisibleLabel: { type: "string" },
    diagnosis: {
      type: "array",
      items: { type: "string" },
    },
    suggestedVerification: {
      type: ["string", "null"],
    },
    structured: {
      type: ["object", "null"],
      additionalProperties: false,
      properties: {
        lemma: {
          anyOf: [lemmaSchema, { type: "null" }],
        },
        examples: {
          type: ["array", "null"],
          items: exampleSchema,
        },
        use: { type: ["string", "null"] },
        pattern: { type: ["string", "null"] },
        common: { type: ["string", "null"] },
        note: { type: ["string", "null"] },
      },
      required: ["lemma", "examples", "use", "pattern", "common", "note"],
    },
  },
  required: ["response", "learnerVisibleLabel", "diagnosis", "suggestedVerification", "structured"],
} as const;

const diagnosticItemSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    mistakeType: { type: "string" },
    topic: { type: ["string", "null"] },
    subtype: { type: ["string", "null"] },
    friction: { type: ["string", "null"] },
    correctForm: { type: ["string", "null"] },
    explanation: { type: ["string", "null"] },
    hiddenExamImpact: {
      type: ["array", "null"],
      items: { type: "string" },
    },
    likelyTransferContexts: {
      type: ["array", "null"],
      items: { type: "string" },
    },
  },
  required: [
    "mistakeType",
    "topic",
    "subtype",
    "friction",
    "correctForm",
    "explanation",
    "hiddenExamImpact",
    "likelyTransferContexts",
  ],
} as const;

const reflectionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    original: { type: "string" },
    friction: { type: "string" },
    question: { type: "string" },
    corrected: { type: "string" },
    explanation: { type: "string" },
  },
  required: ["original", "friction", "question", "corrected", "explanation"],
} as const;

const diagnosticResponderSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    response: { type: "string" },
    learnerVisibleLabel: { type: "string" },
    diagnosis: {
      type: "array",
      items: { type: "string" },
    },
    suggestedVerification: {
      type: ["string", "null"],
    },
    structured: {
      type: ["object", "null"],
      additionalProperties: false,
      properties: {
        intro: { type: ["string", "null"] },
        lemma: {
          anyOf: [lemmaSchema, { type: "null" }],
        },
        examples: {
          type: ["array", "null"],
          items: exampleSchema,
        },
        use: { type: ["string", "null"] },
        pattern: { type: ["string", "null"] },
        common: { type: ["string", "null"] },
        note: { type: ["string", "null"] },
        diagnosis: {
          type: ["array", "null"],
          items: diagnosticItemSchema,
        },
        reflection: {
          anyOf: [reflectionSchema, { type: "null" }],
        },
        priorMistakeReminder: { type: ["string", "null"] },
      },
      required: [
        "intro",
        "lemma",
        "examples",
        "use",
        "pattern",
        "common",
        "note",
        "diagnosis",
        "reflection",
        "priorMistakeReminder",
      ],
    },
  },
  required: ["response", "learnerVisibleLabel", "diagnosis", "suggestedVerification", "structured"],
} as const;

function getPromptFilename(inputType: ClassifierResult["inputType"]) {
  if (inputType === "word_query") {
    return "response_word_query.md";
  }

  if (inputType === "grammar_question") {
    return "response_grammar_question.md";
  }

  if (inputType === "sentence_correction") {
    return "response_sentence_correction.md";
  }

  return "response_phrase_query.md";
}

function getResponderSchema(inputType: ClassifierResult["inputType"]) {
  if (inputType === "grammar_question" || inputType === "sentence_correction") {
    return diagnosticResponderSchema;
  }

  return responderSchema;
}

function getSchemaName(inputType: ClassifierResult["inputType"]) {
  if (inputType === "grammar_question" || inputType === "sentence_correction") {
    return "slice_two_diagnostic_responder";
  }

  return "slice_two_lookup_responder";
}

type PriorMistakeNote = {
  mistakeType: string;
  subtype: string | null;
};

function buildPriorMistakeNote(input: string, priorMistakes: PriorMistakeNote[]) {
  const prior = priorMistakes[0];

  if (!prior) {
    return null;
  }

  return [
    `Note for assistant: This learner has previously struggled with "${input}" specifically with ${prior.mistakeType}, subtype "${prior.subtype ?? "general"}".`,
    `Use this knowledge gently. Example phrasing: "Yeh wala word aapne pehle bhi padha tha - ${prior.subtype ?? "ek chhota pattern"} yaad kar lete hain."`,
    "Do not repeat the full earlier explanation; reference and continue.",
  ].join("\n");
}

function addDisplayNameFallback(
  result: ResponderResult,
  inputType: ClassifierResult["inputType"],
  responseDepth: ResponseDepth,
  displayName: string | null,
) {
  if (!displayName || responseDepth !== "guided_explanation") {
    return result;
  }

  if (inputType !== "grammar_question" && inputType !== "sentence_correction") {
    return result;
  }

  if (result.response.includes(displayName)) {
    return result;
  }

  const intro = `${displayName}, yeh wala thoda dhyaan se dekhna padega.`;
  return {
    ...result,
    response: `${intro}\n\n${result.response}`,
    structured: {
      ...(result.structured ?? {}),
      intro: result.structured?.intro || intro,
    },
  };
}

function isMistakeType(value: string): value is MistakeType {
  return MISTAKE_TYPES.includes(value as MistakeType);
}

function normalizeMistakeType(item: StructuredDiagnosisItem): MistakeType {
  if (item.mistakeType && isMistakeType(item.mistakeType)) {
    return item.mistakeType;
  }

  if (item.topic && isCoreGrammarTopic(item.topic)) {
    return getMistakeTypesForGrammarTopic(item.topic)[0];
  }

  if (item.mistakeType === "vocabulary_choice") {
    return "word_meaning";
  }

  return "transfer_failure";
}

function normalizeHiddenExamImpact(item: StructuredDiagnosisItem) {
  const impact = item.hiddenExamImpact ?? [];
  const knownImpact = impact.filter((value) =>
    [
      "grammar_accuracy.",
      "vocabulary.",
      "text_understanding.",
      "audio_understanding.",
      "writing.",
      "speaking.",
    ].some((prefix) => value.startsWith(prefix)),
  );

  if (knownImpact.length > 0) {
    return knownImpact;
  }

  if (item.topic && isCoreGrammarTopic(item.topic)) {
    return [];
  }

  if (item.mistakeType === "vocabulary_choice") {
    return ["text_understanding.vocabulary_in_context"];
  }

  return ["grammar_accuracy"];
}

function normalizeDiagnosticContent(result: ResponderResult): ResponderResult {
  const items = result.structured?.diagnosis;

  if (!items?.length) {
    return result;
  }

  return {
    ...result,
    structured: {
      ...(result.structured ?? {}),
      diagnosis: items.map((item) => ({
        ...item,
        mistakeType: normalizeMistakeType(item),
        hiddenExamImpact: normalizeHiddenExamImpact(item),
      })),
    },
  };
}

export async function buildResponse(
  input: string,
  classification: ClassifierResult,
  options: {
    responseDepth: ResponseDepth;
    displayName?: string | null;
    priorMistakes?: PriorMistakeNote[];
  },
) {
  const [systemCore, styleGuide, taskPrompt, fewShot] = await Promise.all([
    loadPrompt("system_core.md"),
    loadPrompt("style_guide_hinglish.md"),
    loadPrompt(getPromptFilename(classification.inputType)),
    loadPrompt("few_shot_word_phrase.md"),
  ]);

  const priorMistakeNote = buildPriorMistakeNote(input, options.priorMistakes ?? []);
  const displayNameRule = [
    `Display name available: ${options.displayName || ""}`,
    "Use the display name only when response depth is guided_explanation and the point is genuinely tricky.",
    "Use it at most once, at the start of one sentence. Never use it in a meaning gloss line.",
  ].join("\n");

  const systemPrompt = [systemCore, styleGuide, taskPrompt, fewShot, displayNameRule, priorMistakeNote]
    .filter(Boolean)
    .join("\n\n---\n\n");
  const userPrompt = [
    `Classified input type: ${classification.inputType}`,
    `Depth hint: ${classification.depthHint}`,
    `Response depth: ${options.responseDepth}`,
    `Hidden exam relevance: ${classification.hiddenExamRelevance.join(", ") || "none"}`,
    "",
    `Learner input: ${input}`,
  ].join("\n");

  const result = await runStructuredPrompt<ResponderResult>({
    systemPrompt,
    userPrompt,
    schemaName: getSchemaName(classification.inputType),
    schema: getResponderSchema(classification.inputType),
  });
  const data = normalizeDiagnosticContent(
    addDisplayNameFallback(result.data, classification.inputType, options.responseDepth, options.displayName ?? null),
  );

  return {
    ...result,
    data: {
      ...data,
      learnerVisibleLabel: data.learnerVisibleLabel || LEARNER_VISIBLE_LABELS.vocabulary_in_context,
    },
  };
}
