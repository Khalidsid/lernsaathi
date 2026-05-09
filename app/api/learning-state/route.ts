/**
 * Slice 3.8: Learning State API
 *
 * Returns current learning state for the authenticated user:
 * - Due revision count
 * - Active mistake count
 * - Today's completed review count
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  try {
    const [dueRevisions, activeMistakes, todayReviews] = await Promise.all([
      // Due revision cards
      db.revisionItem.count({
        where: {
          mistake: {
            userId,
          },
          nextReview: {
            lte: now,
          },
        },
      }),

      // Active mistakes
      db.mistake.count({
        where: {
          userId,
          status: "active",
        },
      }),

      // Today's completed reviews (approximation: count revision events today)
      // Slice 3.9.1: Count persisted revision progress via Mistake.lastReviewedAt.
      // This counts unique mistakes reviewed today (not every button press).
      db.mistake.count({
        where: {
          userId,
          lastReviewedAt: {
            gte: startOfToday,
          },
        },
      }),
    ]);

    return NextResponse.json({
      dueRevisions,
      activeMistakes,
      todayReviews,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching learning state:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
