"use client";

import { AssistantBlock } from "@/components/AssistantBlock";
import { UserBubble } from "@/components/UserBubble";

import type { AssistantAttemptKind } from "@/components/AssistantBlock";
import type { ChatMessage } from "@/lib/chat-types";

type MessageListProps = {
  isPending?: boolean;
  messages: ChatMessage[];
  onAttempt?: (parentEventId: string, value: string, kind: AssistantAttemptKind) => Promise<void>;
};

function PendingAssistantBlock() {
  return (
    <div className="max-w-[92%]">
      <div className="assistant-bg fade-in rounded-2xl rounded-tl-md px-4 py-4 dark:bg-[#232825]">
        <div className="flex items-center gap-2 text-[15px] leading-[1.65] text-ink2 dark:text-[#CFCDC4]">
          <span>Soch raha hoon...</span>
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-teal motion-safe:animate-pulse dark:bg-tealLt2"
          />
        </div>
      </div>
    </div>
  );
}

export function MessageList({ isPending = false, messages = [], onAttempt }: MessageListProps) {
  if (messages.length === 0 && !isPending) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-8 text-center">
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
            isAttemptDisabled={isPending}
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
      {isPending ? <PendingAssistantBlock /> : null}
    </div>
  );
}
