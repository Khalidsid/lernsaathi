"use client";

import { AssistantBlock } from "@/components/AssistantBlock";
import { UserBubble } from "@/components/UserBubble";

import type { AssistantAttemptKind } from "@/components/AssistantBlock";
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

type MessageListProps = {
  messages: ChatMessage[];
  onAttempt?: (parentEventId: string, value: string, kind: AssistantAttemptKind) => Promise<void>;
};

export function MessageList({ messages, onAttempt }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex min-h-[460px] flex-col items-center justify-center px-8 text-center">
        <p className="serif max-w-xs text-[15px] leading-[1.6] text-ink3 dark:text-ink4">
          German ka koi word ya phrase likhein.
          <br />
          Main matlab aur ek example doonga.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {messages.map((message) => (
        message.role === "assistant" ? (
          <AssistantBlock
            eventId={message.eventId}
            key={message.id}
            label={message.learnerVisibleLabel}
            onAttempt={onAttempt}
            response={message.text}
            structured={message.structured}
            verificationPrompt={message.verificationPrompt}
          />
        ) : (
          <UserBubble key={message.id}>{message.text}</UserBubble>
        )
      ))}
    </div>
  );
}
