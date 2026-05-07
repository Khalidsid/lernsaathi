import { forwardRef } from "react";

import { cn } from "@/lib/cn";

type GhostRevealLinkProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const GhostRevealLink = forwardRef<HTMLButtonElement, GhostRevealLinkProps>(function GhostRevealLink(
  { className, children = "Show explanation anyway", ...props },
  ref,
) {
  return (
    <button
      className={cn(
        "text-[12.5px] text-ink4 underline-offset-4 transition hover:text-ink3 hover:underline focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal dark:text-ink4 dark:hover:text-mist",
        className,
      )}
      ref={ref}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
});
