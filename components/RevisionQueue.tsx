"use client";

import { useState } from "react";
import { CheckCircle, Clock } from "lucide-react";

import { RevisionCard } from "@/components/RevisionCard";

import type { RevisionCardData, RevisionRating } from "@/lib/revision-types";

type RevisionQueueProps = {
  initialCards: RevisionCardData[];
};

function EmptyRevisionState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-10 text-center animate-fade-in">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 dark:bg-green-950/30">
        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" aria-hidden="true" />
      </div>
      <div className="serif text-[28px] leading-[1.2] text-ink dark:text-mist">
        All done
        <br />
        for today!
      </div>
      <div className="serif mt-4 text-[15px] italic text-ink3 dark:text-ink4">See you tomorrow.</div>
      <div className="mt-8 text-[13px] text-ink3 dark:text-ink4">
        <p className="mb-2">Want more practice?</p>
        <p>
          Write some German in the{" "}
          <a
            href="/chat?tab=chat"
            className="font-medium text-tealDk underline decoration-1 underline-offset-2 hover:text-teal dark:text-teal dark:hover:text-tealLt2"
          >
            Chat tab
          </a>
          .
        </p>
      </div>
    </div>
  );
}

export function RevisionQueue({ initialCards }: RevisionQueueProps) {
  const [cards, setCards] = useState(initialCards);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const current = cards[0];

  const totalCards = initialCards.length;
  const currentIndex = reviewedCount + 1;
  const progress = totalCards > 0 ? (reviewedCount / totalCards) * 100 : 0;

  async function review(rating: RevisionRating) {
    if (!current || isPending) {
      return;
    }

    setIsPending(true);
    setError(null);
    setFeedback(null);

    const response = await fetch("/api/revision/review", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-idempotency-key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        itemId: current.id,
        rating,
      }),
    });

    setIsPending(false);

    if (!response.ok) {
      setError("Couldn't save right now. Please try again in a moment.");
      return;
    }

    const result = (await response.json()) as {
      ok: boolean;
      settled?: boolean;
      nextReviewDays?: number;
    };

    // Show feedback message
    if (result.settled) {
      setFeedback("Great! This pattern is now settled.");
    } else if (result.nextReviewDays !== undefined) {
      const days = result.nextReviewDays;
      if (days === 1) {
        setFeedback("You'll see this again tomorrow.");
      } else if (days === 2) {
        setFeedback("You'll see this again in 2 days.");
      } else {
        setFeedback(`You'll see this again in ${days} days.`);
      }
    }

    // Trigger exit animation, then remove card
    setIsExiting(true);
    setTimeout(() => {
      setReviewedCount((count) => count + 1);
      setCards((existing) => existing.slice(1));
      setIsExiting(false);
    }, 300); // Match animation duration

    // Clear feedback after 3 seconds
    setTimeout(() => setFeedback(null), 3000);
  }

  if (!current) {
    return <EmptyRevisionState />;
  }

  return (
    <div className="flex h-full flex-col px-5 py-6">
      {/* Progress Header */}
      <div className="mb-5 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-ink2 dark:text-[#CFCDC4]">
            Card {currentIndex} / {totalCards}
          </div>
          <div className="text-xs text-ink3 dark:text-ink4">
            {reviewedCount} reviewed
          </div>
        </div>
        {/* Progress Bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
          <div
            className="h-full rounded-full bg-teal transition-all duration-500 ease-out dark:bg-tealLt2"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <RevisionCard
        back={current.back}
        className={`flex-1 ${isExiting ? "animate-slide-out-left" : "animate-slide-in-right"}`}
        explanation={current.explanation}
        front={current.front}
        isPending={isPending}
        learnerVisibleLabel={current.learnerVisibleLabel}
        onReview={review}
      />
      {error ? <p className="mt-3 text-center text-[13px] text-[#9a4d32] dark:text-amber-300/80">{error}</p> : null}
      {feedback ? (
        <div className="mt-3 flex items-center justify-center gap-2 text-[13px] text-teal dark:text-tealLt2 animate-fade-in">
          <Clock className="h-3.5 w-3.5" />
          <p>{feedback}</p>
        </div>
      ) : null}
    </div>
  );
}
