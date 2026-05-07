import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLearnerVisibleLabelForEvent } from "@/lib/pipeline/labels";

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{Letter}\p{Number}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getReflectionFeedback(attemptText: string, corrected: string, explanation: string) {
  const normalizedAttempt = normalize(attemptText);
  const normalizedCorrected = normalize(corrected);

  if (normalizedAttempt && normalizedCorrected && normalizedAttempt === normalizedCorrected) {
    return "Yeh form sahi hai. Isi pattern ko agle sentence mein bhi lagayein.";
  }

  return `Is attempt mein abhi wahi point reh gaya hai.\n\nCorrect form:\n${corrected}\n\nReason:\n${explanation}`;
}

function getChhotaCheckFeedback(attemptText: string) {
  return `Aapka jawab note ho gaya: ${attemptText}\n\nIs point ko hum agle step mein dobara use karenge.`;
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    },
  });

  if (!parent) {
    return NextResponse.json({ error: "Original event nahi mila." }, { status: 404 });
  }

  const structured = parent.structured as {
    reflection?: {
      corrected?: string;
      explanation?: string;
    } | null;
  } | null;
  const corrected = structured?.reflection?.corrected ?? "";
  const explanation = structured?.reflection?.explanation ?? "";
  const response =
    kind === "reflection"
      ? getReflectionFeedback(attemptText, corrected, explanation)
      : getChhotaCheckFeedback(attemptText);
  const learnerVisibleLabel = getLearnerVisibleLabelForEvent("sentence_correction");
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
      learnerVisibleLabel,
      verificationUsed: false,
      learnerResult: "unknown",
      mistakeCreated: false,
      uncertaintyFlagged: false,
      llmModel: "template",
      llmTokensIn: 0,
      llmTokensOut: 0,
      llmLatencyMs: 0,
    },
    select: { id: true },
  });

  return NextResponse.json({
    eventId: event.id,
    response,
    learnerVisibleLabel,
    responseDepth: "guided_explanation",
  });
}
