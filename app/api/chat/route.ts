import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logChatEvent } from "@/lib/logging";
import { runLearningPipeline } from "@/lib/pipeline";
import { createMistakesFromCandidates, markMistakesReviewed } from "@/lib/pipeline/mistakes";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { input?: string };
  const input = body.input?.trim() ?? "";

  if (!input) {
    return NextResponse.json({ error: "Kuch German word ya phrase likhein." }, { status: 400 });
  }

  const result = await runLearningPipeline(input, { userId: session.user.id });

  const event = await db.learningEvent.create({
    data: {
      userId: session.user.id,
      inputType: result.inputType,
      rawInput: input,
      taskType: result.taskType,
      hiddenExamRelevance: result.hiddenExamRelevance,
      diagnosis: result.diagnosis,
      responseDepth: result.responseDepth,
      response: result.response,
      structured: result.structured ?? undefined,
      learnerVisibleLabel: result.learnerVisibleLabel,
      verificationUsed: result.verificationUsed,
      verificationPrompt: result.verificationPrompt,
      learnerResult: "unknown",
      mistakeCreated: result.mistakeCreated,
      mistakeId: null,
      uncertaintyFlagged: result.uncertaintyFlagged,
      llmModel: result.llmModel,
      llmTokensIn: result.llmTokensIn,
      llmTokensOut: result.llmTokensOut,
      llmLatencyMs: result.llmLatencyMs,
    },
    select: { id: true },
  });
  const mistakeIds = await createMistakesFromCandidates({
    candidates: result.mistakeCandidates,
    inputType: result.inputType,
    rawInput: input,
    response: result.response,
    sourceEventId: event.id,
    userId: session.user.id,
  });
  await markMistakesReviewed(result.priorMistakeReviewIds);

  if (mistakeIds.length > 0) {
    await db.learningEvent.update({
      where: { id: event.id },
      data: {
        mistakeCreated: true,
        mistakeId: mistakeIds[0],
      },
    });
  }

  logChatEvent({
    userId: session.user.id,
    inputType: result.inputType,
    depthHint: result.responseDepth,
    latencyMs: result.llmLatencyMs,
    tokensIn: result.llmTokensIn,
    tokensOut: result.llmTokensOut,
  });

  return NextResponse.json({
    eventId: event.id,
    response: result.response,
    responseDepth: result.responseDepth,
    structured: result.structured,
    learnerVisibleLabel: result.learnerVisibleLabel,
    verificationPrompt: result.verificationPrompt,
  });
}
