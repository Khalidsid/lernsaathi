import { forwardRef } from "react";

import { cn } from "@/lib/cn";

type UserBubbleProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
};

export const UserBubble = forwardRef<HTMLDivElement, UserBubbleProps>(function UserBubble(
  { className, children, ...props },
  ref,
) {
  return (
    <div className="flex justify-end">
      <div
        className={cn(
          "max-w-[82%] rounded-2xl rounded-br-md bg-paper2 px-4 py-2.5 text-[15px] leading-relaxed text-ink dark:bg-night3 dark:text-mist",
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    </div>
  );
});
