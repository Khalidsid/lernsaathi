"use client";

import { useState } from "react";

type NamePromptModalProps = {
  onClose: () => void;
};

export function NamePromptModal({ onClose }: NamePromptModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(body: { displayName?: string | null; skip?: boolean }) {
    setIsPending(true);
    setError(null);

    const response = await fetch("/api/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    setIsPending(false);

    if (!response.ok) {
      setError("Couldn't save right now. Please try again in a moment.");
      return;
    }

    onClose();
  }

  return (
    <div className="absolute inset-0 z-30 bg-[rgba(20,20,18,0.28)] backdrop-blur-[8px]">
      <div className="absolute inset-x-0 bottom-0 px-4 pb-6">
        <div className="fade-in rounded-2xl bg-paper p-6 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.25)] dark:bg-night2">
        <p className="serif text-[22px] tracking-[-0.005em] text-ink dark:text-mist">What's your name?</p>
        <p className="mt-2 text-[14px] leading-relaxed text-ink3 dark:text-ink4">
          This is just for personalization. You can skip if you prefer.
        </p>
        <label className="mt-5 block">
          <span className="sr-only">Your name</span>
          <input
            className="w-full rounded-xl border border-rule bg-paper2 px-4 py-3 text-[15px] text-ink outline-none placeholder:text-ink4 focus:border-teal dark:border-[#2E2E2B] dark:bg-night3 dark:text-mist"
            disabled={isPending}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Your name"
            value={displayName}
          />
        </label>
        {error ? <p className="mt-3 text-sm text-[#9a4d32]">{error}</p> : null}
        <div className="mt-5 flex items-center justify-between gap-4">
          <button
            className="px-2 py-1 text-[14px] text-ink3 transition hover:text-ink2 disabled:opacity-70 dark:text-ink4 dark:hover:text-mist"
            disabled={isPending}
            onClick={() => submit({ skip: true })}
            type="button"
          >
            Skip for now
          </button>
          <button
            className="rounded-xl bg-teal px-5 py-2.5 text-[14px] font-medium text-paper transition hover:bg-tealDk disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isPending || !displayName.trim()}
            onClick={() => submit({ displayName })}
            type="button"
          >
            {isPending ? "Saving..." : "Continue"}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
