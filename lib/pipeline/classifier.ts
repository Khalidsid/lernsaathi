import { loadPrompt } from "@/lib/prompts";
import { runStructuredPrompt } from "@/lib/openai";

export type ClassifierResult = {
  inputType: "word_query" | "phrase_query" | "grammar_question" | "sentence_correction" | "out_of_scope";
  taskType: string | null;
  hiddenExamRelevance: string[];
  depthHint: "quick_answer" | "guided_explanation" | "full_diagnostic";
};

const classifierSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    inputType: {
      type: "string",
      enum: ["word_query", "phrase_query", "grammar_question", "sentence_correction", "out_of_scope"],
    },
    taskType: {
      type: ["string", "null"],
    },
    hiddenExamRelevance: {
      type: "array",
      items: { type: "string" },
    },
    depthHint: {
      type: "string",
      enum: ["quick_answer", "guided_explanation", "full_diagnostic"],
    },
  },
  required: ["inputType", "taskType", "hiddenExamRelevance", "depthHint"],
} as const;

export async function classifyInput(input: string) {
  const systemPrompt = await loadPrompt("classifier.md");
  const result = await runStructuredPrompt<ClassifierResult>({
    systemPrompt,
    userPrompt: input,
    schemaName: "slice_two_classifier",
    schema: classifierSchema,
  });

  return result;
}
