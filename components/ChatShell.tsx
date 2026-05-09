"use client";

import { useEffect, useRef, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { Composer } from "@/components/Composer";
import { LearningStatePanel } from "@/components/LearningStatePanel";
import { MessageList } from "@/components/MessageList";
import { MistakesPanel } from "@/components/MistakesPanel";
import { NamePromptModal } from "@/components/NamePromptModal";
import { RevisionQueue } from "@/components/RevisionQueue";

import type { AssistantAttemptKind } from "@/components/AssistantBlock";
import type { ChatTab } from "@/components/TabBar";
import type { ChatMessage } from "@/lib/chat-types";
import type { MistakeGroup, RevisionCardData } from "@/lib/revision-types";
import type { StructuredAssistantContent } from "@/lib/assistant-response";

type AccountIdentity = {
  label: string;
  email?: string | null;
};

type ChatShellProps = {
  account: AccountIdentity;
  activeTab: ChatTab;
  initialMessages: ChatMessage[];
  mistakeGroups: MistakeGroup[];
  revisionCards: RevisionCardData[];
  shouldPromptForName: boolean;
};

export function ChatShell({
  account,
  activeTab,
  initialMessages = [],
  mistakeGroups = [],
  revisionCards = [],
  shouldPromptForName,
}: ChatShellProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isSending, setIsSending] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(shouldPromptForName);
  const streamEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages, isSending]);

  async function handleSend(value: string) {
    if (isSending) {
      return;
    }

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
          "x-idempotency-key": crypto.randomUUID(),
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
        text: payload.response || payload.error || "Couldn't get a response right now.",
        learnerVisibleLabel: payload.learnerVisibleLabel,
        structured: payload.structured ?? null,
        verificationPrompt: payload.verificationPrompt ?? null,
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch {
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: "Couldn't get a response right now.",
        structured: null,
        verificationPrompt: null,
      };

      setMessages((current) => [...current, assistantMessage]);
    } finally {
      setIsSending(false);
    }
  }

  async function handleAttempt(parentEventId: string, value: string, kind: AssistantAttemptKind) {
    if (isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: value,
    };

    setMessages((current) => [...current, userMessage]);
    setIsSending(true);

    try {
      const response = await fetch("/api/chat/attempt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": crypto.randomUUID(),
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
        text: payload.response || payload.error || "Couldn't get a response right now.",
        learnerVisibleLabel: payload.learnerVisibleLabel,
        structured: null,
        verificationPrompt: null,
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch {
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: "Couldn't get a response right now.",
        structured: null,
        verificationPrompt: null,
      };

      setMessages((current) => [...current, assistantMessage]);
    } finally {
      setIsSending(false);
    }
  }

  if (activeTab === "revision") {
    return (
      <AppShell account={account} activeTab={activeTab}>
        <RevisionQueue initialCards={revisionCards} />
      </AppShell>
    );
  }

  if (activeTab === "mistakes") {
    return (
      <AppShell account={account} activeTab={activeTab}>
        <MistakesPanel groups={mistakeGroups} />
      </AppShell>
    );
  }

  return (
    <AppShell
      account={account}
      activeTab={activeTab}
      footer={<Composer disabled={showNamePrompt} isSending={isSending} onSend={handleSend} />}
      learningState={<LearningStatePanel />}
    >
      <div className="relative h-full overflow-hidden">
        <div className="h-full overflow-y-auto px-4 py-5">
          <MessageList isPending={isSending} messages={messages} onAttempt={handleAttempt} onQuickStart={handleSend} />
          <div ref={streamEndRef} />
        </div>
        {showNamePrompt ? <NamePromptModal onClose={() => setShowNamePrompt(false)} /> : null}
      </div>
    </AppShell>
  );
}
