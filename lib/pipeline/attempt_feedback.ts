import { loadPrompt } from "@/lib/prompts";
import { runStructuredPrompt } from "@/lib/openai";

const attemptFeedbackSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    response: { type: "string" },
    learnerResult: {
      type: "string",
      enum: ["correct", "incorrect", "unclear"],
    },
  },
  required: ["response", "learnerResult"],
} as const;

export type AttemptFeedbackResult = {
  response: string;
  learnerResult: "correct" | "incorrect" | "unclear";
};

export async function buildAttemptFeedback({
  attemptText,
  displayName,
  kind,
  parentInputType,
  parentRawInput,
  parentStructured,
  verificationPrompt,
}: {
  attemptText: string;
  displayName: string | null;
  kind: "reflection" | "chhota_check";
  parentInputType: string;
  parentRawInput: string;
  parentStructured: unknown;
  verificationPrompt: string | null;
}) {
  const [systemCore, styleGuide, attemptPrompt] = await Promise.all([
    loadPrompt("system_core.md"),
    loadPrompt("style_guide_hinglish.md"),
    loadPrompt("response_attempt_feedback.md"),
  ]);
  const systemPrompt = [systemCore, styleGuide, attemptPrompt].join("\n\n---\n\n");
  const userPrompt = [
    `Attempt kind: ${kind}`,
    `Display name available: ${displayName ?? ""}`,
    `Parent input type: ${parentInputType}`,
    `Original learner input: ${parentRawInput}`,
    `Verification prompt: ${verificationPrompt ?? ""}`,
    "",
    "Original structured response:",
    JSON.stringify(parentStructured ?? null),
    "",
    `Learner attempt: ${attemptText}`,
  ].join("\n");

  return runStructuredPrompt<AttemptFeedbackResult>({
    systemPrompt,
    userPrompt,
    schemaName: "slice_two_attempt_feedback",
    schema: attemptFeedbackSchema,
  });
}
