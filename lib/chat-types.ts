import type { StructuredAssistantContent } from "@/lib/assistant-response";

export type ChatMessage = {
  id: string;
  eventId?: string;
  learnerVisibleLabel?: string;
  role: "user" | "assistant";
  structured?: StructuredAssistantContent | null;
  text: string;
  verificationPrompt?: string | null;
};
