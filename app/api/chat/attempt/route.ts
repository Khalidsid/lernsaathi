import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildIdempotencyHash, getIdempotencyKey, getIdempotencyResult, storeIdempotencyResponse } from "@/lib/idempotency";
import { getDailyLimitMessage, DailySpendCapError } from "@/lib/openai";
import { buildAttemptFeedback } from "@/lib/pipeline/attempt_feedback";
import { getLearnerVisibleLabelForEvent } from "@/lib/pipeline/labels";
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

  const body = (await request.json()) as {
    attemptText?: string;
    kind?: "reflection" | "chhota_check";
    parentEventId?: string;
  };
  const attemptText = body.attemptText?.trim() ?? "";
  const parentEventId = body.parentEventId?.trim() ?? "";
  const kind = body.kind ?? "reflection";

  if (!attemptText || !parentEventId) {
    return NextResponse.json({ error: "Apna jawab likhein." }, { status: 400 });
  }

  const idempotencyKey = getIdempotencyKey(request);
  const requestHash = buildIdempotencyHash({ attemptText, kind, parentEventId });
  const idempotencyResult = await getIdempotencyResult({
    key: idempotencyKey,
    requestHash,
    route: "/api/chat/attempt",
    userId: session.user.id,
  });

  if (idempotencyResult.kind === "hash_mismatch") {
    return NextResponse.json({ error: "Idempotency key already used with different payload." }, { status: 409 });
  }

  if (idempotencyResult.kind === "replay") {
    return NextResponse.json(idempotencyResult.payload, { status: idempotencyResult.statusCode });
  }

  const parent = await db.learningEvent.findFirst({
    where: {
      id: parentEventId,
      userId: session.user.id,
    },
    select: {
      id: true,
      inputType: true,
      rawInput: true,
      structured: true,
      verificationPrompt: true,
    },
  });

  if (!parent) {
    return NextResponse.json({ error: "Original event nahi mila." }, { status: 404 });
  }

  const learnerVisibleLabel = getLearnerVisibleLabelForEvent("sentence_correction");
  const profile = await db.learnerProfile.findUnique({
    where: { userId: session.user.id },
    select: { displayName: true },
  });
  let feedback;

  try {
    feedback = await buildAttemptFeedback({
      userId: session.user.id,
      attemptText,
      displayName: profile?.displayName ?? null,
      kind,
      parentInputType: parent.inputType,
      parentRawInput: parent.rawInput,
      parentStructured: parent.structured,
      verificationPrompt: parent.verificationPrompt,
    });
  } catch (error) {
    if (!(error instanceof DailySpendCapError)) {
      throw error;
    }

    const response = getDailyLimitMessage();
    const event = await db.learningEvent.create({
      data: {
        userId: session.user.id,
        inputType: "daily_limit_reached",
        rawInput: parent.rawInput,
        attemptText,
        attemptParentEventId: parent.id,
        taskType: "attempt_feedback",
        hiddenExamRelevance: [],
        diagnosis: ["daily_limit_reached"],
        responseDepth: "quick_answer",
        response,
        idempotencyKey: idempotencyKey ?? undefined,
        learnerVisibleLabel: getLearnerVisibleLabelForEvent("daily_limit_reached"),
        verificationUsed: false,
        learnerResult: "unknown",
        mistakeCreated: false,
        uncertaintyFlagged: false,
        llmModel: "gpt-5",
        llmTokensIn: 0,
        llmTokensOut: 0,
        llmLatencyMs: 0,
      },
      select: { id: true },
    });

    const responsePayload = {
      eventId: event.id,
      response,
      learnerVisibleLabel: getLearnerVisibleLabelForEvent("daily_limit_reached"),
      responseDepth: "quick_answer",
    };

    await storeIdempotencyResponse({
      key: idempotencyKey,
      requestHash,
      response: responsePayload,
      route: "/api/chat/attempt",
      statusCode: 200,
      userId: session.user.id,
    });

    return NextResponse.json(responsePayload);
  }

  const response = feedback.data.response;
  const event = await db.learningEvent.create({
    data: {
      userId: session.user.id,
      inputType: `${parent.inputType}_${kind}`,
      rawInput: parent.rawInput,
      attemptText,
      attemptParentEventId: parent.id,
      taskType: "attempt_feedback",
      hiddenExamRelevance: [],
      diagnosis: [],
      responseDepth: "guided_explanation",
      response,
      idempotencyKey: idempotencyKey ?? undefined,
      learnerVisibleLabel,
      verificationUsed: false,
      learnerResult: feedback.data.learnerResult,
      mistakeCreated: false,
      uncertaintyFlagged: false,
      llmModel: feedback.meta.model,
      llmTokensIn: feedback.meta.inputTokens ?? 0,
      llmTokensOut: feedback.meta.outputTokens ?? 0,
      llmLatencyMs: feedback.meta.latencyMs,
    },
    select: { id: true },
  });

  const responsePayload = {
    eventId: event.id,
    response,
    learnerVisibleLabel,
    responseDepth: "guided_explanation",
  };

  await storeIdempotencyResponse({
    key: idempotencyKey,
    requestHash,
    response: responsePayload,
    route: "/api/chat/attempt",
    statusCode: 200,
    userId: session.user.id,
  });

  return NextResponse.json(responsePayload);
}
