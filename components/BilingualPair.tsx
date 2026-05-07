import { forwardRef } from "react";

import { cn } from "@/lib/cn";

type BilingualPairProps = React.HTMLAttributes<HTMLDivElement> & {
  de: string;
  hi: string;
};

export const BilingualPair = forwardRef<HTMLDivElement, BilingualPairProps>(function BilingualPair(
  { className, de, hi, ...props },
  ref,
) {
  return (
    <div className={cn("bipair", className)} ref={ref} {...props}>
      <div className="de text-[15px] leading-[1.55] text-ink dark:text-mist">{de}</div>
      <div className="hi mt-0.5 text-[15px] leading-[1.55] text-ink dark:text-mist">{hi}</div>
    </div>
  );
});
