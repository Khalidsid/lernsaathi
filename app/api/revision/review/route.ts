import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { buildIdempotencyHash, getIdempotencyKey, getIdempotencyResult, storeIdempotencyResponse } from "@/lib/idempotency";
import { reviewRevisionItem } from "@/lib/revision-data";

import type { RevisionRating } from "@/lib/revision-types";

function isRevisionRating(value: string | undefined): value is RevisionRating {
  return value === "again" || value === "good";
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    itemId?: string;
    rating?: string;
  };
  const itemId = body.itemId?.trim() ?? "";

  if (!itemId || !isRevisionRating(body.rating)) {
    return NextResponse.json({ error: "Review data missing." }, { status: 400 });
  }

  const idempotencyKey = getIdempotencyKey(request);
  const requestHash = buildIdempotencyHash({ itemId, rating: body.rating });
  const idempotencyResult = await getIdempotencyResult({
    key: idempotencyKey,
    requestHash,
    route: "/api/revision/review",
    userId: session.user.id,
  });

  if (idempotencyResult.kind === "hash_mismatch") {
    return NextResponse.json({ error: "Idempotency key already used with different payload." }, { status: 409 });
  }

  if (idempotencyResult.kind === "replay") {
    return NextResponse.json(idempotencyResult.payload, { status: idempotencyResult.statusCode });
  }

  const result = await reviewRevisionItem({
    itemId,
    rating: body.rating,
    userId: session.user.id,
  });

  if (!result) {
    return NextResponse.json({ error: "Revision item nahi mila." }, { status: 404 });
  }

  const responsePayload = { ok: true, settled: result.shouldSettle };

  await storeIdempotencyResponse({
    key: idempotencyKey,
    requestHash,
    response: responsePayload,
    route: "/api/revision/review",
    statusCode: 200,
    userId: session.user.id,
  });

  return NextResponse.json(responsePayload);
}
