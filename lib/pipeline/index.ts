import { getLearnerVisibleLabelForEvent } from "@/lib/pipeline/labels";
import { db } from "@/lib/db";
import { logPipelineEvent } from "@/lib/logging";
import { getDailyLimitMessage, DailySpendCapError } from "@/lib/openai";
import { classifyInput } from "@/lib/pipeline/classifier";
import { selectResponseDepth } from "@/lib/pipeline/depth";
import { buildResponse } from "@/lib/pipeline/responder";
import { buildVerificationPrompt } from "@/lib/pipeline/verifier";

import type { StructuredDiagnosisItem } from "@/lib/assistant-response";
import type { Mistake } from "@prisma/client";

const OUT_OF_SCOPE_MESSAGE =
  "Yeh feature abhi available nahi hai. Filhal aap sirf koi German word ya phrase ka matlab pooch sakte hain.";

type UsageMeta = { inputTokens: number | null; outputTokens: number | null; latencyMs: number; model: string } | null;

function combineUsage(meta: UsageMeta[]) {
  return meta.reduce(
    (accumulator, item) => ({
      llmModel: item?.model || accumulator.llmModel,
      llmTokensIn: accumulator.llmTokensIn + (item?.inputTokens ?? 0),
      llmTokensOut: accumulator.llmTokensOut + (item?.outputTokens ?? 0),
      llmLatencyMs: accumulator.llmLatencyMs + (item?.latencyMs ?? 0),
    }),
    {
      llmModel: "gpt-5",
      llmTokensIn: 0,
      llmTokensOut: 0,
      llmLatencyMs: 0,
    },
  );
}

type PriorMistake = Pick<Mistake, "id" | "mistakeType" | "subtype" | "exampleInput" | "correctForm">;

function inputLooksLikeLemma(input: string) {
  return input.trim().length > 1 && !input.includes("?") && input.trim().split(/\s+/).length <= 3;
}

async function findOpenMistakesForInput(userId: string, input: string, inputType: string): Promise<PriorMistake[]> {
  if ((inputType !== "word_query" && inputType !== "phrase_query") || !inputLooksLikeLemma(input)) {
    return [];
  }

  return db.mistake.findMany({
    where: {
      userId,
      status: "active",
      OR: [
        { exampleInput: { contains: input, mode: "insensitive" } },
        { correctForm: { contains: input, mode: "insensitive" } },
        { subtype: { contains: input, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      mistakeType: true,
      subtype: true,
      exampleInput: true,
      correctForm: true,
    },
    take: 3,
  });
}

function getMistakeCandidates(inputType: string, structuredDiagnosis: StructuredDiagnosisItem[] | null | undefined) {
  if (inputType !== "grammar_question" && inputType !== "sentence_correction") {
    return [];
  }

  return structuredDiagnosis ?? [];
}

export async function runLearningPipeline(input: string, context: { userId: string }) {
  try {
    logPipelineEvent("pipeline_start", {
      inputPreview: input.slice(0, 80),
    });
    const classifier = await classifyInput(input);
    const priorMistakes = await findOpenMistakesForInput(context.userId, input, classifier.data.inputType);
    const responseDepth = selectResponseDepth(classifier.data.inputType, classifier.data, priorMistakes);
    const profile = await db.learnerProfile.findUnique({
      where: { userId: context.userId },
      select: { displayName: true },
    });

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
        responseDepth,
        response: OUT_OF_SCOPE_MESSAGE,
        learnerVisibleLabel: getLearnerVisibleLabelForEvent("out_of_scope"),
        diagnosis: ["feature_not_available_yet"],
        verificationPrompt: null,
        structured: null,
        verificationUsed: false,
        uncertaintyFlagged: false,
        mistakeCreated: false,
        mistakeCandidates: [],
        priorMistakeReviewIds: [],
        ...usage,
      };
    }

    const responder = await buildResponse(input, classifier.data, {
      responseDepth,
      displayName: profile?.displayName ?? null,
      priorMistakes,
    });
    const verifier = await buildVerificationPrompt({
      input,
      inputType: classifier.data.inputType,
      responseDepth,
      responder: responder.data,
    });
    const usage = combineUsage([classifier.meta, responder.meta, verifier.meta]);
    logPipelineEvent("pipeline_response_complete", {
      inputType: classifier.data.inputType,
      depthHint: responseDepth,
    });

    return {
      inputType: classifier.data.inputType,
      taskType: classifier.data.taskType,
      hiddenExamRelevance: classifier.data.hiddenExamRelevance,
      responseDepth,
      response: responder.data.response,
      learnerVisibleLabel: responder.data.learnerVisibleLabel,
      diagnosis: responder.data.diagnosis,
      verificationPrompt: verifier.data.verificationPrompt,
      structured: responder.data.structured ?? null,
      verificationUsed: Boolean(verifier.data.verificationPrompt),
      uncertaintyFlagged: false,
      mistakeCreated: false,
      mistakeCandidates: getMistakeCandidates(classifier.data.inputType, responder.data.structured?.diagnosis),
      priorMistakeReviewIds: priorMistakes.map((mistake) => mistake.id),
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
        mistakeCandidates: [],
        priorMistakeReviewIds: [],
        llmModel: "gpt-5",
        llmTokensIn: 0,
        llmTokensOut: 0,
        llmLatencyMs: 0,
      };
    }

    throw error;
  }
}
