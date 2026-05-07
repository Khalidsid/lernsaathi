"use client";

import { Composer } from "@/components/Composer";

type MessageInputProps = {
  disabled?: boolean;
  isSending: boolean;
  onSend: (value: string) => Promise<void>;
};

export function MessageInput({ disabled = false, isSending, onSend }: MessageInputProps) {
  return <Composer disabled={disabled} isSending={isSending} onSend={onSend} />;
}
