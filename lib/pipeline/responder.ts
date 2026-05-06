import { LEARNER_VISIBLE_LABELS } from "@/lib/pipeline/labels";
import { loadPrompt } from "@/lib/prompts";
import { runStructuredPrompt } from "@/lib/openai";

import type { ClassifierResult } from "@/lib/pipeline/classifier";

export type ResponderResult = {
  response: string;
  learnerVisibleLabel: string;
  diagnosis: string[];
  suggestedVerification: string | null;
};

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
  },
  required: ["response", "learnerVisibleLabel", "diagnosis", "suggestedVerification"],
} as const;

function getPromptFilename(inputType: ClassifierResult["inputType"]) {
  if (inputType === "word_query") {
    return "response_word_query.md";
  }

  return "response_phrase_query.md";
}

export async function buildResponse(input: string, classification: ClassifierResult) {
  const [systemCore, styleGuide, taskPrompt, fewShot] = await Promise.all([
    loadPrompt("system_core.md"),
    loadPrompt("style_guide_hinglish.md"),
    loadPrompt(getPromptFilename(classification.inputType)),
    loadPrompt("few_shot_word_phrase.md"),
  ]);

  const systemPrompt = [systemCore, styleGuide, taskPrompt, fewShot].join("\n\n---\n\n");
  const userPrompt = [
    `Classified input type: ${classification.inputType}`,
    `Depth hint: ${classification.depthHint}`,
    `Hidden exam relevance: ${classification.hiddenExamRelevance.join(", ") || "none"}`,
    "",
    `Learner input: ${input}`,
  ].join("\n");

  const result = await runStructuredPrompt<ResponderResult>({
    systemPrompt,
    userPrompt,
    schemaName: "slice_one_responder",
    schema: responderSchema,
  });

  return {
    ...result,
    data: {
      ...result.data,
      learnerVisibleLabel: result.data.learnerVisibleLabel || LEARNER_VISIBLE_LABELS.vocabulary_in_context,
    },
  };
}
