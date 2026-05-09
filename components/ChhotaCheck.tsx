"use client";

import { forwardRef } from "react";

import { AttemptInput } from "@/components/AttemptInput";
import { cn } from "@/lib/cn";

type ChhotaCheckProps = React.HTMLAttributes<HTMLDivElement> & {
  disabled?: boolean;
  onReply?: (value: string) => Promise<void>;
  prompt: string;
};

export const ChhotaCheck = forwardRef<HTMLDivElement, ChhotaCheckProps>(function ChhotaCheck(
  { className, disabled = false, onReply, prompt, ...props },
  ref,
) {
  return (
    <div className={cn("mt-4 border-t border-rule pt-4 dark:border-[#2E2E2B]", className)} ref={ref} {...props}>
      <div className="serif mb-1.5 text-[12px] lowercase italic tracking-wide text-ink3 dark:text-ink4">
        chhota check
      </div>
      <p className="text-[14.5px] leading-[1.65] text-ink2 dark:text-[#CFCDC4]">{prompt}</p>
      {onReply ? (
        <AttemptInput className="mt-3" disabled={disabled} onSubmit={onReply} placeholder="Apna jawab likhein..." />
      ) : null}
    </div>
  );
});
