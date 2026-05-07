"use client";

import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Composer } from "@/components/Composer";
import { MessageList } from "@/components/MessageList";
import { NamePromptModal } from "@/components/NamePromptModal";

import type { AssistantAttemptKind } from "@/components/AssistantBlock";
import type { ChatTab } from "@/components/TabBar";
import type { StructuredAssistantContent } from "@/lib/assistant-response";

type ChatMessage = {
  id: string;
  eventId?: string;
  role: "user" | "assistant";
  text: string;
  learnerVisibleLabel?: string;
  structured?: StructuredAssistantContent | null;
  verificationPrompt?: string | null;
};

type ChatShellProps = {
  activeTab: ChatTab;
  shouldPromptForName: boolean;
};

function PlaceholderCard({ body, title }: { body: string; title: string }) {
  return (
    <div className="flex h-full min-h-[460px] items-center justify-center px-8 text-center">
      <div className="max-w-sm rounded-2xl border border-rule bg-paper2/60 p-8 dark:border-[#2E2E2B] dark:bg-night2">
        <div className="serif text-[28px] leading-[1.2] tracking-[-0.015em] text-ink dark:text-mist">{title}</div>
        <p className="mt-4 whitespace-pre-line text-[15px] leading-[1.7] text-ink3 dark:text-ink4">{body}</p>
      </div>
    </div>
  );
}

export function ChatShell({ activeTab, shouldPromptForName }: ChatShellProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(shouldPromptForName);

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
        eventId?: string;
        error?: string;
        response?: string;
        learnerVisibleLabel?: string;
        structured?: StructuredAssistantContent | null;
        verificationPrompt?: string | null;
      };

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        eventId: payload.eventId,
        role: "assistant",
        text: payload.response || payload.error || "Abhi jawab nahi aa paaya.",
        learnerVisibleLabel: payload.learnerVisibleLabel,
        structured: payload.structured ?? null,
        verificationPrompt: payload.verificationPrompt ?? null,
      };

      setMessages((current) => [...current, assistantMessage]);
    } finally {
      setIsSending(false);
    }
  }

  async function handleAttempt(parentEventId: string, value: string, kind: AssistantAttemptKind) {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: value,
    };

    setMessages((current) => [...current, userMessage]);

    const response = await fetch("/api/chat/attempt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        attemptText: value,
        kind,
        parentEventId,
      }),
    });
    const payload = (await response.json()) as {
      eventId?: string;
      error?: string;
      response?: string;
      learnerVisibleLabel?: string;
    };
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      eventId: payload.eventId,
      role: "assistant",
      text: payload.response || payload.error || "Abhi jawab nahi aa paaya.",
      learnerVisibleLabel: payload.learnerVisibleLabel,
      structured: null,
      verificationPrompt: null,
    };

    setMessages((current) => [...current, assistantMessage]);
  }

  if (activeTab === "revision") {
    return (
      <AppShell activeTab={activeTab}>
        <PlaceholderCard
          body={"Jo cheezein aapko mushkil lagi thi, woh yahan dohra-ne ke liye milengi."}
          title="Yeh feature jaldi aa raha hai."
        />
      </AppShell>
    );
  }

  if (activeTab === "mistakes") {
    return (
      <AppShell activeTab={activeTab}>
        <PlaceholderCard
          body={"Aapki purani galtiyaan yahan dikhengi, taaki aap unhein dheere-dheere theek kar sakein."}
          title="Yeh feature jaldi aa raha hai."
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      activeTab={activeTab}
      footer={<Composer disabled={showNamePrompt} isSending={isSending} onSend={handleSend} />}
    >
      <div className="relative h-full min-h-[calc(100vh-9.5rem)] overflow-hidden">
        <div className="h-full overflow-y-auto px-4 py-5">
          <MessageList messages={messages} onAttempt={handleAttempt} />
        </div>
        {showNamePrompt ? <NamePromptModal onClose={() => setShowNamePrompt(false)} /> : null}
      </div>
    </AppShell>
  );
}
