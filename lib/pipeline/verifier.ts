import { loadPrompt } from "@/lib/prompts";
import { runStructuredPrompt } from "@/lib/openai";

import type { ClassifierResult } from "@/lib/pipeline/classifier";
import type { ResponseDepth } from "@/lib/pipeline/depth";
import type { ResponderResult } from "@/lib/pipeline/responder";

const verifierSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    verificationPrompt: { type: "string" },
  },
  required: ["verificationPrompt"],
} as const;

export type VerifierResult = {
  verificationPrompt: string | null;
};

export async function buildVerificationPrompt({
  userId,
  input,
  inputType,
  responseDepth,
  responder,
}: {
  userId?: string;
  input: string;
  inputType: ClassifierResult["inputType"];
  responseDepth: ResponseDepth;
  responder: ResponderResult;
}) {
  if (
    responseDepth !== "guided_explanation" ||
    (inputType !== "grammar_question" && inputType !== "sentence_correction")
  ) {
    return {
      data: {
        verificationPrompt: null,
      } satisfies VerifierResult,
      meta: null,
    };
  }

  const systemPrompt = await loadPrompt("verifier_chhota_check.md");
  const userPrompt = [
    `Input type: ${inputType}`,
    `Learner input: ${input}`,
    "",
    "Assistant response:",
    responder.response,
    "",
    "Structured response:",
    JSON.stringify(responder.structured ?? null),
  ].join("\n");

  return runStructuredPrompt<VerifierResult>({
    userId,
    systemPrompt,
    userPrompt,
    schemaName: "slice_two_chhota_check",
    schema: verifierSchema,
  });
}
