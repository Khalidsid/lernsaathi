import { forwardRef } from "react";

import { LemmaAnchor } from "@/components/LemmaAnchor";
import { cn } from "@/lib/cn";

type RevisionCardProps = React.HTMLAttributes<HTMLDivElement> & {
  lemma?: string;
};

export const RevisionCard = forwardRef<HTMLDivElement, RevisionCardProps>(function RevisionCard(
  { className, lemma = "die Leistung", ...props },
  ref,
) {
  return (
    <div
      className={cn("flex min-h-[360px] flex-col rounded-2xl border border-rule bg-paper2 p-6 dark:border-[#2E2E2B] dark:bg-night2", className)}
      ref={ref}
      {...props}
    >
      <div className="serif text-[12px] lowercase text-ink3 dark:text-ink4">phir se sochein</div>
      <div className="mt-5">
        <LemmaAnchor className="inline-block text-[34px] leading-[1.1] tracking-[-0.015em] text-ink dark:text-mist">
          {lemma}
        </LemmaAnchor>
      </div>
      <div className="mt-6 text-[15.5px] leading-[1.6] text-ink2 dark:text-[#CFCDC4]">
        Yeh word kab use hota hai? Apne shabdon mein bataein.
      </div>
      <div className="flex-1" />
      <div className="mt-8 flex items-center justify-between gap-3">
        <button className="rounded-xl border border-rule bg-paper px-4 py-2.5 text-[14px] text-ink transition hover:bg-paper2 dark:border-[#2E2E2B] dark:bg-night dark:text-mist" type="button">
          Show
        </button>
        <button className="rounded-xl bg-teal px-5 py-2.5 text-[14px] font-medium text-paper transition hover:bg-tealDk" type="button">
          Aage badhein
        </button>
      </div>
    </div>
  );
});
