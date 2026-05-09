"use client";

import { forwardRef, useState } from "react";

import { LemmaAnchor } from "@/components/LemmaAnchor";
import { cn } from "@/lib/cn";

import type { RevisionRating } from "@/lib/revision-types";

type RevisionCardProps = React.HTMLAttributes<HTMLDivElement> & {
  back?: string;
  explanation?: string | null;
  front?: string;
  isPending?: boolean;
  learnerVisibleLabel?: string;
  onReview?: (rating: RevisionRating) => Promise<void>;
};

export const RevisionCard = forwardRef<HTMLDivElement, RevisionCardProps>(function RevisionCard(
  {
    back = "die Leistung = kaam ka result, ya kaam kitna achha hua",
    className,
    explanation,
    front = "die Leistung",
    isPending = false,
    learnerVisibleLabel = "phir se sochein",
    onReview,
    ...props
  },
  ref,
) {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div
      className={cn(
        "flex min-h-[360px] flex-col rounded-2xl border border-rule bg-paper2 p-6 dark:border-[#2E2E2B] dark:bg-night2",
        className,
      )}
      ref={ref}
      {...props}
    >
      <div className="serif text-[12px] lowercase italic text-ink3 dark:text-ink4">{learnerVisibleLabel}</div>
      <div className="mt-5">
        <LemmaAnchor className="inline-block text-[26px] leading-[1.2] text-ink dark:text-mist">
          {front}
        </LemmaAnchor>
      </div>
      <div className="mt-6 text-[15.5px] leading-[1.6] text-ink2 dark:text-[#CFCDC4]">
        Isko phir se sochiye. Pehle apna jawab man mein banaiye, phir answer dekhiye.
      </div>
      {isRevealed ? (
        <div className="mt-5 rounded-xl border border-rule bg-paper p-4 dark:border-[#2E2E2B] dark:bg-night">
          <div className="serif mb-1.5 text-[12px] lowercase text-ink3 dark:text-ink4">answer</div>
          <p className="whitespace-pre-wrap text-[15px] leading-[1.65] text-ink2 dark:text-[#CFCDC4]">{back}</p>
          {explanation ? (
            <p className="mt-3 whitespace-pre-wrap text-[14px] leading-[1.6] text-ink3 dark:text-ink4">{explanation}</p>
          ) : null}
        </div>
      ) : null}
      <div className="flex-1" />
      <div className="mt-8 flex items-center justify-between gap-3">
        {!isRevealed ? (
          <button
            className="rounded-xl border border-rule bg-paper px-4 py-2.5 text-[14px] text-ink transition hover:bg-paper2 disabled:opacity-70 dark:border-[#2E2E2B] dark:bg-night dark:text-mist"
            disabled={isPending}
            onClick={() => setIsRevealed(true)}
            type="button"
          >
            Show
          </button>
        ) : (
          <>
            <button
              className="rounded-xl border border-rule bg-paper px-4 py-2.5 text-[14px] text-ink transition hover:bg-paper2 disabled:opacity-70 dark:border-[#2E2E2B] dark:bg-night dark:text-mist"
              disabled={isPending}
              onClick={() => onReview?.("again")}
              type="button"
            >
              Again
            </button>
            <button
              className="rounded-xl bg-teal px-5 py-2.5 text-[14px] font-medium text-paper transition hover:bg-tealDk disabled:opacity-70"
              disabled={isPending}
              onClick={() => onReview?.("good")}
              type="button"
            >
              Got it
            </button>
          </>
        )}
      </div>
    </div>
  );
});
