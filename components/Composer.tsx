"use client";

import { forwardRef, useState } from "react";
import { ArrowUp, Image } from "lucide-react";

import { ImageChip } from "@/components/ImageChip";
import { cn } from "@/lib/cn";

type ComposerProps = Omit<React.HTMLAttributes<HTMLDivElement>, "onSubmit"> & {
  disabled?: boolean;
  isSending: boolean;
  onSend: (value: string) => Promise<void>;
};

export const Composer = forwardRef<HTMLDivElement, ComposerProps>(function Composer(
  { className, disabled = false, isSending, onSend, ...props },
  ref,
) {
  const [value, setValue] = useState("");
  const [attachedImage, setAttachedImage] = useState(false);
  const isDisabled = disabled || isSending || !value.trim();

  async function submit() {
    const nextValue = value.trim();

    if (!nextValue || disabled || isSending) {
      return;
    }

    setValue("");
    setAttachedImage(false);
    await onSend(nextValue);
  }

  return (
    <div className={cn("space-y-2", className)} ref={ref} {...props}>
      {attachedImage ? (
        <ImageChip className="ml-1" filename="klasse-04.png" onRemove={() => setAttachedImage(false)} />
      ) : null}
      <div className="flex items-center gap-2 rounded-2xl border border-rule bg-paper2 py-2 pl-3 pr-2 dark:border-[#2E2E2B] dark:bg-night2">
        <button
          aria-label="Attach image"
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-ink3 transition hover:bg-rule hover:text-ink2 disabled:opacity-70 dark:text-ink4 dark:hover:bg-night3 dark:hover:text-mist",
            attachedImage && "bg-tealLt text-tealDk",
          )}
          disabled={disabled || isSending}
          onClick={() => setAttachedImage(true)}
          type="button"
        >
          <Image aria-hidden="true" size={16} strokeWidth={2} />
        </button>
        <input
          className="min-w-0 flex-1 bg-transparent py-1.5 text-[15px] text-ink outline-none placeholder:text-ink4 disabled:opacity-70 dark:text-mist"
          disabled={disabled || isSending}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void submit();
            }
          }}
          placeholder={attachedImage ? "kuch aur likhein..." : "Yahan likhein..."}
          value={value}
        />
        <button
          aria-label="Send"
          className={cn("send-btn transition", isDisabled && "send-btn-disabled")}
          disabled={isDisabled}
          onClick={() => void submit()}
          type="button"
        >
          <ArrowUp aria-hidden="true" size={14} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
});
