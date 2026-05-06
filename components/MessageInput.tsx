"use client";

import { useState } from "react";

type MessageInputProps = {
  disabled?: boolean;
  isSending: boolean;
  onSend: (value: string) => Promise<void>;
};

export function MessageInput({ disabled = false, isSending, onSend }: MessageInputProps) {
  const [value, setValue] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextValue = value.trim();
    if (!nextValue || disabled || isSending) {
      return;
    }

    setValue("");
    await onSend(nextValue);
  }

  return (
    <form className="rounded-[26px] border border-border bg-surface-strong p-3 shadow-soft" onSubmit={handleSubmit}>
      <div className="flex items-end gap-3">
        <textarea
          className="min-h-[64px] flex-1 resize-none rounded-2xl bg-transparent px-3 py-2 text-sm leading-6 text-ink outline-none placeholder:text-muted"
          disabled={disabled || isSending}
          onChange={(event) => setValue(event.target.value)}
          placeholder="German word ya phrase likhein..."
          rows={3}
          value={value}
        />
        <button
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-accent px-5 text-sm font-medium text-white transition hover:bg-[#b36c2c] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={disabled || isSending || !value.trim()}
          type="submit"
        >
          {isSending ? "Ja raha hai..." : "Bhejein"}
        </button>
      </div>
    </form>
  );
}
