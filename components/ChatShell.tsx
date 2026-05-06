"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

import { MessageInput } from "@/components/MessageInput";
import { MessageList } from "@/components/MessageList";
import { NamePromptModal } from "@/components/NamePromptModal";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  learnerVisibleLabel?: string;
};

type ChatShellProps = {
  appName: string;
  shouldPromptForName: boolean;
};

export function ChatShell({ appName, shouldPromptForName }: ChatShellProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(shouldPromptForName);

  useEffect(() => {
    const dismissed = window.sessionStorage.getItem("display-name-prompt-dismissed") === "1";

    if (dismissed) {
      setShowNamePrompt(false);
    }
  }, []);

  async function handleSend(value: string) {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: value,
    };

    setMessages((current) => [...current, userMessage]);
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input: value }),
      });

      const payload = (await response.json()) as {
        error?: string;
        response?: string;
        learnerVisibleLabel?: string;
      };

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: payload.response || payload.error || "Abhi jawab nahi aa paaya.",
        learnerVisibleLabel: payload.learnerVisibleLabel,
      };

      setMessages((current) => [...current, assistantMessage]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="relative flex min-h-[calc(100vh-1.5rem)] w-full flex-col rounded-shell border border-border bg-surface p-4 shadow-soft backdrop-blur sm:p-6">
      <header className="flex items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="font-display text-2xl text-ink">{appName}</p>
        </div>
        <button
          className="rounded-full border border-border px-4 py-2 text-sm text-muted transition hover:border-accent hover:text-ink"
          onClick={() => signOut({ callbackUrl: "/login" })}
          type="button"
        >
          Logout
        </button>
      </header>

      <div className="relative mt-4 flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto pr-1">
          <MessageList messages={messages} />
        </div>
        {showNamePrompt ? <NamePromptModal onClose={() => setShowNamePrompt(false)} /> : null}
      </div>

      <div className="mt-4">
        <MessageInput disabled={showNamePrompt} isSending={isSending} onSend={handleSend} />
      </div>
    </section>
  );
}
