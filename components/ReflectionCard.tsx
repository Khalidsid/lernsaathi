"use client";

import { forwardRef, useState } from "react";

import { AttemptInput } from "@/components/AttemptInput";
import { GhostRevealLink } from "@/components/GhostRevealLink";
import { cn } from "@/lib/cn";

type ReflectionCardProps = React.HTMLAttributes<HTMLDivElement> & {
  corrected: string;
  disabled?: boolean;
  explanation: string;
  friction: string;
  onAttempt?: (value: string) => Promise<void>;
  original: string;
  question: string;
};

function highlightFriction(original: string, friction: string) {
  if (!friction || !original.includes(friction)) {
    return original;
  }

  const start = original.indexOf(friction);
  const before = original.slice(0, start);
  const after = original.slice(start + friction.length);
  return (
    <>
      {before}
      <span className="friction text-amber-700/80 dark:text-amber-300/70">{friction}</span>
      {after}
    </>
  );
}

export const ReflectionCard = forwardRef<HTMLDivElement, ReflectionCardProps>(function ReflectionCard(
  { className, corrected, disabled = false, explanation, friction, onAttempt, original, question, ...props },
  ref,
) {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div className={cn("space-y-3", className)} ref={ref} {...props}>
      <p className="text-[14.5px] leading-[1.65] text-ink2 dark:text-[#CFCDC4]">
        Aapke sentence mein yeh part dhyaan dene wala hai:
      </p>
      <div className="border-l-2 border-rule pl-3 text-[14.5px] leading-[1.65] text-ink dark:border-[#3A3A35] dark:text-mist">
        {highlightFriction(original, friction)}
      </div>
      <p className="text-[14.5px] leading-[1.65] text-ink2 dark:text-[#CFCDC4]">{question}</p>

      {onAttempt ? <AttemptInput className="mt-4" disabled={disabled} onSubmit={onAttempt} /> : null}

      <div>
        <GhostRevealLink onClick={() => setIsRevealed((current) => !current)}>
          {isRevealed ? "Hide explanation" : "Show explanation anyway"}
        </GhostRevealLink>
      </div>

      {isRevealed ? (
        <div className="space-y-2 rounded-xl border border-rule bg-paper/70 p-3 dark:border-[#2E2E2B] dark:bg-night2/80">
          <div>
            <div className="serif mb-1 text-[12px] lowercase text-ink3 dark:text-ink4">correct form</div>
            <p className="text-[14.5px] font-medium leading-[1.6] text-ink dark:text-mist">{corrected}</p>
          </div>
          <p className="text-[14.5px] leading-[1.65] text-ink2 dark:text-[#CFCDC4]">{explanation}</p>
        </div>
      ) : null}
    </div>
  );
});
