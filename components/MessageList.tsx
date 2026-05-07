"use client";

import { AssistantBlock } from "@/components/AssistantBlock";
import { UserBubble } from "@/components/UserBubble";

import type { StructuredAssistantContent } from "@/lib/assistant-response";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  learnerVisibleLabel?: string;
  structured?: StructuredAssistantContent | null;
};

type MessageListProps = {
  messages: ChatMessage[];
};

export function MessageList({ messages }: MessageListProps) {
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
            key={message.id}
            label={message.learnerVisibleLabel}
            response={message.text}
            structured={message.structured}
          />
        ) : (
          <UserBubble key={message.id}>{message.text}</UserBubble>
        )
      ))}
    </div>
  );
}
