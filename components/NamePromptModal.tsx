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
      setError("Abhi save nahi ho paaya. Thoda baad phir try karein.");
      return;
    }

    window.sessionStorage.setItem("display-name-prompt-dismissed", "1");
    onClose();
  }

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[rgba(32,25,19,0.28)] px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-shell border border-border bg-surface-strong p-6 shadow-soft">
        <p className="font-display text-2xl text-ink">Aapka naam kya hai?</p>
        <p className="mt-3 text-sm leading-6 text-muted">
          Yeh sirf personalisation ke liye hai. Aap chahein to skip kar sakte hain.
        </p>
        <label className="mt-6 block">
          <span className="mb-2 block text-sm text-muted">Naam</span>
          <input
            className="w-full rounded-2xl border border-border bg-[rgba(255,255,255,0.7)] px-4 py-3 text-sm text-ink outline-none transition focus:border-accent"
            disabled={isPending}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Jaise: Sana"
            value={displayName}
          />
        </label>
        {error ? <p className="mt-3 text-sm text-[#9a4d32]">{error}</p> : null}
        <div className="mt-6 flex items-center justify-between gap-4">
          <button
            className="text-sm text-muted underline-offset-4 transition hover:text-ink hover:underline disabled:opacity-70"
            disabled={isPending}
            onClick={() => submit({ skip: true })}
            type="button"
          >
            Abhi nahi
          </button>
          <button
            className="inline-flex items-center justify-center rounded-2xl bg-ink px-5 py-3 text-sm font-medium text-white transition hover:bg-[#3a3024] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isPending || !displayName.trim()}
            onClick={() => submit({ displayName })}
            type="button"
          >
            {isPending ? "Rukiye..." : "Aage badhein"}
          </button>
        </div>
      </div>
    </div>
  );
}
