"use client";

import { Sparkles } from "lucide-react";

import { AssistantBlock } from "@/components/AssistantBlock";
import { UserBubble } from "@/components/UserBubble";

import type { AssistantAttemptKind } from "@/components/AssistantBlock";
import type { ChatMessage } from "@/lib/chat-types";

type MessageListProps = {
  isPending?: boolean;
  messages: ChatMessage[];
  onAttempt?: (parentEventId: string, value: string, kind: AssistantAttemptKind) => Promise<void>;
  onQuickStart?: (prompt: string) => void;
};

function PendingAssistantBlock() {
  return (
    <div className="max-w-[92%]">
      <div className="assistant-bg fade-in rounded-2xl rounded-tl-md px-4 py-4 dark:bg-[#232825]">
        <div className="flex items-center gap-2 text-[15px] leading-[1.65] text-ink2 dark:text-[#CFCDC4]">
          <span>Thinking...</span>
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-teal motion-safe:animate-pulse dark:bg-tealLt2"
          />
        </div>
      </div>
    </div>
  );
}

const quickStartPrompts = [
  { text: "Hallo", label: "Greet in German" },
  { text: "Ich lerne Deutsch", label: "Simple sentence" },
  { text: "der Apfel", label: "Learn a word" },
];

export function MessageList({ isPending = false, messages = [], onAttempt, onQuickStart }: MessageListProps) {
  if (messages.length === 0 && !isPending) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-8 text-center">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-tealLt dark:bg-tealNight/35 animate-fade-in">
          <Sparkles className="h-5 w-5 text-tealDk dark:text-teal" aria-hidden="true" />
        </div>
        <p className="serif mb-6 max-w-xs text-[15px] leading-[1.6] text-ink3 dark:text-ink4">
          German ka koi word ya phrase likhein.
          <br />
          Main matlab aur ek example doonga.
        </p>
        {onQuickStart ? (
          <div className="flex flex-wrap gap-2 justify-center">
            {quickStartPrompts.map((prompt) => (
              <button
                key={prompt.text}
                onClick={() => onQuickStart(prompt.text)}
                className="group rounded-full border border-rule bg-paper px-4 py-2 text-sm text-ink2 transition hover:border-teal hover:bg-tealLt dark:border-[#2E2E2B] dark:bg-night2 dark:text-mist dark:hover:border-teal dark:hover:bg-tealNight/35 active-press"
                type="button"
              >
                <span className="font-medium group-hover:text-tealDk dark:group-hover:text-teal">{prompt.text}</span>
                <span className="mx-1.5 opacity-40">·</span>
                <span className="text-xs opacity-60">{prompt.label}</span>
              </button>
            ))}
          </div>
        ) : null}
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
