import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildIdempotencyHash, getIdempotencyKey, getIdempotencyResult, storeIdempotencyResponse } from "@/lib/idempotency";
import { logChatEvent } from "@/lib/logging";
import { runLearningPipeline } from "@/lib/pipeline";
import { createMistakesFromCandidates, markMistakesReviewed } from "@/lib/pipeline/mistakes";
import { checkUserRateLimit } from "@/lib/ratelimit";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = checkUserRateLimit(session.user.id);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Bahut jaldi requests aa rahi hain. Thoda ruk kar phir try karein." },
      { status: 429 },
    );
  }

  const body = (await request.json()) as { input?: string };
  const input = body.input?.trim() ?? "";

  if (!input) {
    return NextResponse.json({ error: "Kuch German word ya phrase likhein." }, { status: 400 });
  }

  const idempotencyKey = getIdempotencyKey(request);
  const requestHash = buildIdempotencyHash({ input });
  const idempotencyResult = await getIdempotencyResult({
    key: idempotencyKey,
    requestHash,
    route: "/api/chat",
    userId: session.user.id,
  });

  if (idempotencyResult.kind === "hash_mismatch") {
    return NextResponse.json({ error: "Idempotency key already used with different payload." }, { status: 409 });
  }

  if (idempotencyResult.kind === "replay") {
    return NextResponse.json(idempotencyResult.payload, { status: idempotencyResult.statusCode });
  }

  const result = await runLearningPipeline(input, { userId: session.user.id });

  let eventId = "";

  try {
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
        idempotencyKey: idempotencyKey ?? undefined,
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
    eventId = event.id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && idempotencyKey) {
      const replay = await getIdempotencyResult({
        key: idempotencyKey,
        requestHash,
        route: "/api/chat",
        userId: session.user.id,
      });
      if (replay.kind === "replay") {
        return NextResponse.json(replay.payload, { status: replay.statusCode });
      }
    }
    throw error;
  }

  const mistakeIds = await createMistakesFromCandidates({
    candidates: result.mistakeCandidates,
    inputType: result.inputType,
    rawInput: input,
    response: result.response,
    sourceEventId: eventId,
    userId: session.user.id,
  });
  await markMistakesReviewed(result.priorMistakeReviewIds);

  if (mistakeIds.length > 0) {
    await db.learningEvent.update({
      where: { id: eventId },
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

  const responsePayload = {
    eventId,
    response: result.response,
    responseDepth: result.responseDepth,
    structured: result.structured,
    learnerVisibleLabel: result.learnerVisibleLabel,
    verificationPrompt: result.verificationPrompt,
  };

  await storeIdempotencyResponse({
    key: idempotencyKey,
    requestHash,
    response: responsePayload,
    route: "/api/chat",
    statusCode: 200,
    userId: session.user.id,
  });

  return NextResponse.json(responsePayload);
}
