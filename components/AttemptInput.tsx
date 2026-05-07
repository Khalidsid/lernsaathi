"use client";

import { forwardRef, useState } from "react";
import { ArrowUp } from "lucide-react";

import { cn } from "@/lib/cn";

type AttemptInputProps = Omit<React.HTMLAttributes<HTMLDivElement>, "onSubmit"> & {
  disabled?: boolean;
  onSubmit: (value: string) => Promise<void>;
  placeholder?: string;
};

export const AttemptInput = forwardRef<HTMLDivElement, AttemptInputProps>(function AttemptInput(
  { className, disabled = false, onSubmit, placeholder = "Apna jawab likhein...", ...props },
  ref,
) {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDisabled = disabled || isSubmitting || !value.trim();

  async function submit() {
    const nextValue = value.trim();

    if (!nextValue || disabled || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      setValue("");
      await onSubmit(nextValue);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border border-rule bg-paper py-1.5 pl-3 pr-2 dark:border-[#2E2E2B] dark:bg-night2",
        className,
      )}
      ref={ref}
      {...props}
    >
      <input
        className="min-w-0 flex-1 bg-transparent py-1.5 text-[14.5px] text-ink outline-none placeholder:text-ink4 disabled:opacity-70 dark:text-mist"
        disabled={disabled || isSubmitting}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void submit();
          }
        }}
        placeholder={placeholder}
        value={value}
      />
      <button
        aria-label="Submit attempt"
        className={cn("send-btn transition", isDisabled && "send-btn-disabled")}
        disabled={isDisabled}
        onClick={() => void submit()}
        type="button"
      >
        <ArrowUp aria-hidden="true" size={13} strokeWidth={2.4} />
      </button>
    </div>
  );
});
