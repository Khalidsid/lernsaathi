import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
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

  const result = await reviewRevisionItem({
    itemId,
    rating: body.rating,
    userId: session.user.id,
  });

  if (!result) {
    return NextResponse.json({ error: "Revision item nahi mila." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, settled: result.shouldSettle });
}
