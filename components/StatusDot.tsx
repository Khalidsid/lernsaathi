import { forwardRef } from "react";

import { cn } from "@/lib/cn";

type StatusDotStatus = "open" | "inRevision" | "settled";

const statusClass: Record<StatusDotStatus, string> = {
  open: "bg-teal",
  inRevision: "bg-[#A8C2C0]",
  settled: "bg-tealLt2",
};

const statusLabel: Record<StatusDotStatus, string> = {
  open: "open",
  inRevision: "in revision",
  settled: "settled",
};

type StatusDotProps = React.HTMLAttributes<HTMLSpanElement> & {
  status: StatusDotStatus;
  showLabel?: boolean;
};

export const StatusDot = forwardRef<HTMLSpanElement, StatusDotProps>(function StatusDot(
  { className, status, showLabel = true, ...props },
  ref,
) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[12px] text-ink3", className)} ref={ref} {...props}>
      <span className={cn("inline-block h-2 w-2 rounded-full", statusClass[status])} aria-hidden="true" />
      {showLabel ? <span>{statusLabel[status]}</span> : <span className="sr-only">{statusLabel[status]}</span>}
    </span>
  );
});
