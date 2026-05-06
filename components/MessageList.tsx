"use client";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  learnerVisibleLabel?: string;
};

type MessageListProps = {
  messages: ChatMessage[];
};

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-shell border border-dashed border-border bg-[rgba(255,251,244,0.72)] px-6 text-center">
        <p className="max-w-md text-sm leading-7 text-muted">
          German ka koi word ya phrase likhein. Main matlab aur ek example doonga.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <article
          className={`max-w-3xl rounded-[26px] border px-5 py-4 shadow-soft ${
            message.role === "assistant"
              ? "border-border bg-surface-strong text-ink"
              : "ml-auto border-[rgba(96,130,118,0.24)] bg-[rgba(229,241,236,0.86)] text-[#21352d]"
          }`}
          key={message.id}
        >
          {message.learnerVisibleLabel ? (
            <p className="mb-2 text-xs uppercase tracking-[0.16em] text-muted">{message.learnerVisibleLabel}</p>
          ) : null}
          <div className="whitespace-pre-wrap text-sm leading-7">{message.text}</div>
        </article>
      ))}
    </div>
  );
}
