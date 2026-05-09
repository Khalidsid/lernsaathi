import { db } from "@/lib/db";

import type { StructuredAssistantContent } from "@/lib/assistant-response";
import type { ChatMessage } from "@/lib/chat-types";

export async function getRecentChatMessages(userId: string, take = 18): Promise<ChatMessage[]> {
  const events = await db.learningEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      attemptText: true,
      learnerVisibleLabel: true,
      rawInput: true,
      response: true,
      structured: true,
      verificationPrompt: true,
    },
    take,
  });

  return events.reverse().flatMap((event) => {
    const userText = event.attemptText || event.rawInput;
    return [
      {
        id: `${event.id}:user`,
        role: "user" as const,
        text: userText,
      },
      {
        id: `${event.id}:assistant`,
        eventId: event.id,
        learnerVisibleLabel: event.learnerVisibleLabel,
        role: "assistant" as const,
        structured: event.structured as StructuredAssistantContent | null,
        text: event.response,
        verificationPrompt: event.verificationPrompt,
      },
    ];
  });
}
