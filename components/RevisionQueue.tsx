"use client";

import { useState } from "react";

import { RevisionCard } from "@/components/RevisionCard";

import type { RevisionCardData, RevisionRating } from "@/lib/revision-types";

type RevisionQueueProps = {
  initialCards: RevisionCardData[];
};

function EmptyRevisionState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-10 text-center">
      <div className="serif text-[28px] leading-[1.2] text-ink dark:text-mist">
        Aaj ke liye
        <br />
        bas itna.
      </div>
      <div className="serif mt-4 text-[15px] italic text-ink3 dark:text-ink4">Kal phir milte hain.</div>
    </div>
  );
}

export function RevisionQueue({ initialCards }: RevisionQueueProps) {
  const [cards, setCards] = useState(initialCards);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const current = cards[0];

  async function review(rating: RevisionRating) {
    if (!current || isPending) {
      return;
    }

    setIsPending(true);
    setError(null);

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
      setError("Abhi save nahi ho paaya. Thoda baad phir koshish karein.");
      return;
    }

    setCards((existing) => existing.slice(1));
  }

  if (!current) {
    return <EmptyRevisionState />;
  }

  return (
    <div className="flex h-full flex-col px-5 py-6">
      <RevisionCard
        back={current.back}
        className="flex-1"
        explanation={current.explanation}
        front={current.front}
        isPending={isPending}
        learnerVisibleLabel={current.learnerVisibleLabel}
        onReview={review}
      />
      {error ? <p className="mt-3 text-center text-[13px] text-[#9a4d32] dark:text-amber-300/80">{error}</p> : null}
      <div className="mt-4 text-center">
        <div className="serif text-[12px] italic text-ink4">
          {cards.length > 1 ? `${cards.length - 1} aur baaki hain` : "is ke baad aaj ka set khatam"}
        </div>
      </div>
    </div>
  );
}
