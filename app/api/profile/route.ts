import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    displayName?: string | null;
    skip?: boolean;
  };

  const profile = await db.learnerProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (body.skip) {
    const updated = await db.learnerProfile.update({
      where: { userId: session.user.id },
      data: {
        displayName: null,
        displayNamePromptCount: Math.min(profile.displayNamePromptCount + 1, 2),
      },
    });

    return NextResponse.json({
      displayName: updated.displayName,
      displayNamePromptCount: updated.displayNamePromptCount,
    });
  }

  const displayName = body.displayName?.trim();

  if (!displayName) {
    return NextResponse.json({ error: "Display name is required" }, { status: 400 });
  }

  const updated = await db.learnerProfile.update({
    where: { userId: session.user.id },
    data: {
      displayName,
    },
  });

  return NextResponse.json({
    displayName: updated.displayName,
    displayNamePromptCount: updated.displayNamePromptCount,
  });
}
