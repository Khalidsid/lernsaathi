import { getLearnerVisibleLabelForEvent } from "@/lib/pipeline/labels";
import { logPipelineEvent } from "@/lib/logging";
import { getDailyLimitMessage, DailySpendCapError } from "@/lib/openai";
import { classifyInput } from "@/lib/pipeline/classifier";
import { buildResponse } from "@/lib/pipeline/responder";
import { buildVerificationPrompt } from "@/lib/pipeline/verifier";

const OUT_OF_SCOPE_MESSAGE =
  "Yeh feature abhi available nahi hai. Filhal aap sirf koi German word ya phrase ka matlab pooch sakte hain.";

function combineUsage(meta: Array<{ inputTokens: number | null; outputTokens: number | null; latencyMs: number; model: string }>) {
  return meta.reduce(
    (accumulator, item) => ({
      llmModel: item.model || accumulator.llmModel,
      llmTokensIn: accumulator.llmTokensIn + (item.inputTokens ?? 0),
      llmTokensOut: accumulator.llmTokensOut + (item.outputTokens ?? 0),
      llmLatencyMs: accumulator.llmLatencyMs + item.latencyMs,
    }),
    {
      llmModel: "gpt-5",
      llmTokensIn: 0,
      llmTokensOut: 0,
      llmLatencyMs: 0,
    },
  );
}

export async function runLearningPipeline(input: string) {
  try {
    logPipelineEvent("pipeline_start", {
      inputPreview: input.slice(0, 80),
    });
    const classifier = await classifyInput(input);

    if (classifier.data.inputType === "out_of_scope") {
      logPipelineEvent("pipeline_out_of_scope_short_circuit", {
        inputType: classifier.data.inputType,
        taskType: classifier.data.taskType,
        depthHint: classifier.data.depthHint,
      });
      const usage = combineUsage([classifier.meta]);
      return {
        inputType: "out_of_scope" as const,
        taskType: classifier.data.taskType,
        hiddenExamRelevance: classifier.data.hiddenExamRelevance,
        responseDepth: "quick_answer" as const,
        response: OUT_OF_SCOPE_MESSAGE,
        learnerVisibleLabel: getLearnerVisibleLabelForEvent("out_of_scope"),
        diagnosis: ["feature_not_available_yet"],
        verificationPrompt: null,
        structured: null,
        verificationUsed: false,
        uncertaintyFlagged: false,
        mistakeCreated: false,
        ...usage,
      };
    }

    const responder = await buildResponse(input, classifier.data);
    const verifier = await buildVerificationPrompt();
    const usage = combineUsage([classifier.meta, responder.meta]);
    logPipelineEvent("pipeline_response_complete", {
      inputType: classifier.data.inputType,
      depthHint: classifier.data.depthHint,
    });

    return {
      inputType: classifier.data.inputType,
      taskType: classifier.data.taskType,
      hiddenExamRelevance: classifier.data.hiddenExamRelevance,
      responseDepth: classifier.data.depthHint,
      response: responder.data.response,
      learnerVisibleLabel: responder.data.learnerVisibleLabel,
      diagnosis: responder.data.diagnosis,
      verificationPrompt: verifier.verificationPrompt,
      structured: responder.data.structured ?? null,
      verificationUsed: false,
      uncertaintyFlagged: false,
      mistakeCreated: false,
      ...usage,
    };
  } catch (error) {
    if (error instanceof DailySpendCapError) {
      logPipelineEvent("pipeline_daily_limit_short_circuit", {});
      return {
        inputType: "daily_limit_reached" as const,
        taskType: null,
        hiddenExamRelevance: [],
        responseDepth: "quick_answer" as const,
        response: getDailyLimitMessage(),
        learnerVisibleLabel: getLearnerVisibleLabelForEvent("daily_limit_reached"),
        diagnosis: ["daily_limit_reached"],
        verificationPrompt: null,
        structured: null,
        verificationUsed: false,
        uncertaintyFlagged: false,
        mistakeCreated: false,
        llmModel: "gpt-5",
        llmTokensIn: 0,
        llmTokensOut: 0,
        llmLatencyMs: 0,
      };
    }

    throw error;
  }
}
