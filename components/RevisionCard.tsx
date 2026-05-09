"use client";

import { forwardRef, useEffect, useState } from "react";

import { LemmaAnchor } from "@/components/LemmaAnchor";
import { cn } from "@/lib/cn";

import type { RevisionRating } from "@/lib/revision-types";

function isTextEntryTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

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

  useEffect(() => {
    function handleKeyPress(event: KeyboardEvent) {
      if (isPending) {
        return;
      }

      if (isTextEntryTarget(event.target)) {
        return;
      }

      // Space or Enter to reveal
      if (!isRevealed && (event.key === " " || event.key === "Enter")) {
        event.preventDefault();
        setIsRevealed(true);
        return;
      }

      // Number keys for ratings (after revealed)
      if (isRevealed && !isPending) {
        if (event.key === "1") {
          event.preventDefault();
          onReview?.("again");
        } else if (event.key === "2") {
          event.preventDefault();
          onReview?.("hard");
        } else if (event.key === "3") {
          event.preventDefault();
          onReview?.("good");
        } else if (event.key === "4") {
          event.preventDefault();
          onReview?.("easy");
        }
      }
    }

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isRevealed, isPending, onReview]);

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
      <div className="mt-8">
        {!isRevealed ? (
          <button
            className="w-full rounded-xl border border-rule bg-paper px-4 py-3 text-[14px] font-medium text-ink transition hover:bg-paper2 active-press disabled:opacity-70 dark:border-[#2E2E2B] dark:bg-night dark:text-mist"
            disabled={isPending}
            onClick={() => setIsRevealed(true)}
            type="button"
          >
            Show <span className="ml-1 text-[11px] opacity-60">Space</span>
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              className="rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-3 text-[13px] font-medium text-neutral-700 transition hover:bg-neutral-100 active-press disabled:opacity-70 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              disabled={isPending}
              onClick={() => onReview?.("again")}
              type="button"
            >
              Again <span className="ml-1 text-[11px] opacity-50">1</span>
            </button>
            <button
              className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-3 text-[13px] font-medium text-amber-800 transition hover:bg-amber-100 active-press disabled:opacity-70 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-900/40"
              disabled={isPending}
              onClick={() => onReview?.("hard")}
              type="button"
            >
              Hard <span className="ml-1 text-[11px] opacity-50">2</span>
            </button>
            <button
              className="rounded-xl border border-teal bg-teal/10 px-3 py-3 text-[13px] font-medium text-tealDk transition hover:bg-teal/20 active-press disabled:opacity-70 dark:border-tealLt2 dark:bg-teal/20 dark:text-tealLt2 dark:hover:bg-teal/30"
              disabled={isPending}
              onClick={() => onReview?.("good")}
              type="button"
            >
              Good <span className="ml-1 text-[11px] opacity-50">3</span>
            </button>
            <button
              className="rounded-xl border border-sky-400 bg-sky-50 px-3 py-3 text-[13px] font-medium text-sky-700 transition hover:bg-sky-100 active-press disabled:opacity-70 dark:border-sky-700 dark:bg-sky-950/30 dark:text-sky-300 dark:hover:bg-sky-900/40"
              disabled={isPending}
              onClick={() => onReview?.("easy")}
              type="button"
            >
              Easy <span className="ml-1 text-[11px] opacity-50">4</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
