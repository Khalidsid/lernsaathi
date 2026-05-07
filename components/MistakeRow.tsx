import { forwardRef } from "react";

import { LemmaAnchor } from "@/components/LemmaAnchor";
import { StatusDot } from "@/components/StatusDot";
import { cn } from "@/lib/cn";

type MistakeRowProps = React.HTMLAttributes<HTMLLIElement> & {
  day: string;
  gloss: string;
  lemma: string;
  status: "open" | "inRevision" | "settled";
};

export const MistakeRow = forwardRef<HTMLLIElement, MistakeRowProps>(function MistakeRow(
  { className, day, gloss, lemma, status, ...props },
  ref,
) {
  return (
    <li className={cn("flex items-start gap-3 rounded-xl px-2 py-3 transition hover:bg-paper2 dark:hover:bg-night2", className)} ref={ref} {...props}>
      <StatusDot className="mt-2.5" showLabel={false} status={status} />
      <div className="min-w-0 flex-1">
        <div>
          <LemmaAnchor className="text-[16px] text-ink dark:text-mist">{lemma}</LemmaAnchor>
        </div>
        <div className="mt-0.5 truncate text-[13px] leading-snug text-ink3 dark:text-ink4">{gloss}</div>
      </div>
      <span className="mono mt-1 text-[11px] text-ink4">{day}</span>
    </li>
  );
});
