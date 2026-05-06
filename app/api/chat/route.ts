import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logChatEvent } from "@/lib/logging";
import { runLearningPipeline } from "@/lib/pipeline";

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

  const result = await runLearningPipeline(input);

  await db.learningEvent.create({
    data: {
      userId: session.user.id,
      inputType: result.inputType,
      rawInput: input,
      taskType: result.taskType,
      hiddenExamRelevance: result.hiddenExamRelevance,
      diagnosis: result.diagnosis,
      responseDepth: result.responseDepth,
      response: result.response,
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
  });

  logChatEvent({
    userId: session.user.id,
    inputType: result.inputType,
    depthHint: result.responseDepth,
    latencyMs: result.llmLatencyMs,
    tokensIn: result.llmTokensIn,
    tokensOut: result.llmTokensOut,
  });

  return NextResponse.json({
    response: result.response,
    learnerVisibleLabel: result.learnerVisibleLabel,
    verificationPrompt: result.verificationPrompt,
  });
}
