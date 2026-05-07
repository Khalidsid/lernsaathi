import { forwardRef } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/cn";

type ImageChipProps = React.HTMLAttributes<HTMLDivElement> & {
  filename: string;
  onRemove?: () => void;
};

export const ImageChip = forwardRef<HTMLDivElement, ImageChipProps>(function ImageChip(
  { className, filename, onRemove, ...props },
  ref,
) {
  return (
    <div className={cn("flex items-center gap-2", className)} ref={ref} {...props}>
      <div className="flex items-center gap-2 rounded-full border border-rule bg-paper2 py-1 pl-2 pr-1 dark:border-[#2E2E2B] dark:bg-night2">
        <div
          aria-hidden="true"
          className="h-[18px] w-[18px] rounded-[4px] bg-[repeating-linear-gradient(135deg,#D7D5CC_0_4px,#E6E4DC_4px_8px)]"
        />
        <span className="mono text-[11px] text-ink2 dark:text-mist">{filename}</span>
        <button
          aria-label="Remove image"
          className="flex h-5 w-5 items-center justify-center rounded-full bg-paper text-ink3 transition hover:bg-rule dark:bg-night dark:text-ink4 dark:hover:bg-night3"
          onClick={onRemove}
          type="button"
        >
          <X aria-hidden="true" size={10} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
});
