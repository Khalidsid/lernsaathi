import { db } from "@/lib/db";
import { addDays, buildRevisionItemFromMistake, calculateNextRevisionState } from "@/lib/revision";

import type { MistakeGroup, MistakeListItem, RevisionCardData, RevisionRating } from "@/lib/revision-types";

function toCard(item: {
  back: string;
  explanation: string | null;
  front: string;
  id: string;
  learnerVisibleLabel: string;
  reviewCount: number;
}): RevisionCardData {
  return {
    back: item.back,
    explanation: item.explanation,
    front: item.front,
    id: item.id,
    learnerVisibleLabel: item.learnerVisibleLabel,
    reviewCount: item.reviewCount,
  };
}

function getMistakeStatus(status: string, reviewCount: number): MistakeListItem["status"] {
  if (status === "settled" || status === "mastered") {
    return "settled";
  }

  return reviewCount > 0 ? "inRevision" : "open";
}

function formatDay(date: Date) {
  return new Intl.DateTimeFormat("en", { weekday: "short" }).format(date);
}

function groupMistake(date: Date, now = new Date()) {
  const ageMs = now.getTime() - date.getTime();
  const ageDays = Math.floor(ageMs / 86_400_000);

  if (ageDays < 7) {
    return { id: "this-week", label: "is hafte" };
  }

  if (ageDays < 14) {
    return { id: "last-week", label: "pichle hafte" };
  }

  return { id: "older", label: "purani" };
}

function getMistakeLemma(mistake: { correctForm: string; exampleInput: string; mistakeType: string; subtype: string | null }) {
  return mistake.correctForm.trim() || mistake.subtype?.trim() || mistake.exampleInput.trim() || mistake.mistakeType;
}

function getMistakeGloss(mistake: { explanationGiven: string; mistakeType: string; priority: string; subtype: string | null }) {
  const prefix = mistake.subtype?.trim() || mistake.mistakeType.replaceAll("_", " ");
  const explanation = mistake.explanationGiven.trim();

  if (!explanation) {
    return `${prefix} - ${mistake.priority}`;
  }

  return `${prefix} - ${explanation}`;
}

export async function ensureRevisionItemsForActiveMistakes(userId: string) {
  const mistakes = await db.mistake.findMany({
    where: {
      userId,
      status: "active",
      revisionItems: {
        none: {},
      },
    },
    select: {
      id: true,
      correctForm: true,
      exampleInput: true,
      explanationGiven: true,
      hiddenExamImpact: true,
      mistakeType: true,
      subtype: true,
    },
    take: 50,
  });

  if (mistakes.length === 0) {
    return;
  }

  await db.revisionItem.createMany({
    data: mistakes.map((mistake) => ({
      sourceMistakeId: mistake.id,
      ...buildRevisionItemFromMistake(mistake),
    })),
    skipDuplicates: true,
  });
}

export async function createRevisionItemForMistake(mistakeId: string) {
  const mistake = await db.mistake.findUnique({
    where: { id: mistakeId },
    select: {
      id: true,
      correctForm: true,
      exampleInput: true,
      explanationGiven: true,
      hiddenExamImpact: true,
      mistakeType: true,
      subtype: true,
    },
  });

  if (!mistake) {
    return;
  }

  await db.revisionItem.upsert({
    where: { sourceMistakeId: mistake.id },
    update: {},
    create: {
      sourceMistakeId: mistake.id,
      ...buildRevisionItemFromMistake(mistake),
    },
  });
}

export async function getDueRevisionCards(userId: string, take = 8) {
  await ensureRevisionItemsForActiveMistakes(userId);

  const items = await db.revisionItem.findMany({
    where: {
      nextReview: {
        lte: new Date(),
      },
      mistake: {
        userId,
        status: "active",
      },
    },
    orderBy: [{ nextReview: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      front: true,
      back: true,
      explanation: true,
      learnerVisibleLabel: true,
      reviewCount: true,
    },
    take,
  });

  return items.map(toCard);
}

export async function reviewRevisionItem({
  itemId,
  rating,
  userId,
}: {
  itemId: string;
  rating: RevisionRating;
  userId: string;
}) {
  return db.$transaction(async (tx) => {
    const item = await tx.revisionItem.findFirst({
      where: {
        id: itemId,
        mistake: {
          userId,
          status: "active",
        },
      },
      select: {
        id: true,
        ease: true,
        intervalDays: true,
        reviewCount: true,
        sourceMistakeId: true,
      },
    });

    if (!item) {
      return null;
    }

    const nextState = calculateNextRevisionState({
      ease: item.ease,
      intervalDays: item.intervalDays,
      rating,
      reviewCount: item.reviewCount,
    });
    const now = new Date();
    const updateResult = await tx.revisionItem.updateMany({
      where: {
        id: item.id,
        reviewCount: item.reviewCount,
      },
      data: {
        ease: nextState.ease,
        intervalDays: nextState.intervalDays,
        nextReview: addDays(now, nextState.intervalDays),
        reviewCount: nextState.reviewCount,
      },
    });

    if (updateResult.count === 0) {
      return null;
    }

    await tx.mistake.update({
      where: { id: item.sourceMistakeId },
      data: {
        lastReviewedAt: now,
        reviewCount: {
          increment: 1,
        },
        status: nextState.shouldSettle ? "settled" : "active",
      },
    });

    return nextState;
  });
}

export async function getMistakeGroups(userId: string): Promise<MistakeGroup[]> {
  const mistakes = await db.mistake.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      correctForm: true,
      createdAt: true,
      exampleInput: true,
      explanationGiven: true,
      mistakeType: true,
      priority: true,
      reviewCount: true,
      status: true,
      subtype: true,
    },
    take: 60,
  });

  const groups = new Map<string, MistakeGroup>();

  for (const mistake of mistakes) {
    const group = groupMistake(mistake.createdAt);
    const existing = groups.get(group.id) ?? {
      id: group.id,
      label: group.label,
      items: [],
    };

    existing.items.push({
      day: formatDay(mistake.createdAt),
      gloss: getMistakeGloss(mistake),
      id: mistake.id,
      lemma: getMistakeLemma(mistake),
      priority: mistake.priority,
      status: getMistakeStatus(mistake.status, mistake.reviewCount),
    });
    groups.set(group.id, existing);
  }

  return Array.from(groups.values());
}
