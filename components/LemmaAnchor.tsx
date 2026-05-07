import { forwardRef } from "react";

import { cn } from "@/lib/cn";

type LemmaAnchorProps = React.HTMLAttributes<HTMLSpanElement>;

export const LemmaAnchor = forwardRef<HTMLSpanElement, LemmaAnchorProps>(function LemmaAnchor(
  { className, children, ...props },
  ref,
) {
  return (
    <span className={cn("serif lemma-underline tracking-[-0.005em]", className)} ref={ref} {...props}>
      {children}
    </span>
  );
});
