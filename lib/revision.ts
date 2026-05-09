import type { RevisionRating } from "@/lib/revision-types";

export type RevisionSourceMistake = {
  correctForm: string;
  exampleInput: string;
  explanationGiven: string;
  hiddenExamImpact: string[];
  mistakeType: string;
  subtype?: string | null;
};

type RevisionStateInput = {
  ease: number;
  intervalDays: number;
  rating: RevisionRating;
  reviewCount: number;
};

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function buildRevisionItemFromMistake(mistake: RevisionSourceMistake, now = new Date()) {
  const front = mistake.correctForm.trim() || mistake.exampleInput.trim();
  const back = mistake.correctForm.trim()
    ? mistake.correctForm.trim()
    : mistake.explanationGiven.trim();
  const explanation = mistake.explanationGiven.trim() || null;

  return {
    revisionType: "mistake_transfer",
    front,
    back,
    explanation,
    hiddenExamRelevance: mistake.hiddenExamImpact,
    learnerVisibleLabel: "Wiederholen, was schwer war",
    nextReview: now,
    intervalDays: 1,
    ease: 2.5,
  };
}

export function calculateNextRevisionState({ ease, intervalDays, rating, reviewCount }: RevisionStateInput) {
  if (rating === "again") {
    return {
      ease: Math.max(1.3, Number((ease - 0.2).toFixed(2))),
      intervalDays: 1,
      reviewCount,
      shouldSettle: false,
    };
  }

  const nextReviewCount = reviewCount + 1;
  const nextEase = Math.min(3, Number((ease + 0.1).toFixed(2)));
  const nextInterval =
    reviewCount === 0 ? 1 : Math.min(14, Math.max(intervalDays + 1, Math.ceil(intervalDays * nextEase)));

  return {
    ease: nextEase,
    intervalDays: nextInterval,
    reviewCount: nextReviewCount,
    shouldSettle: nextReviewCount >= 3,
  };
}
