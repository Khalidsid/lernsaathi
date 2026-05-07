import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
});

type ChatLogFields = {
  userId: string;
  inputType: string;
  depthHint: string;
  latencyMs: number | null;
  tokensIn: number | null;
  tokensOut: number | null;
  error?: string;
};

export function logChatEvent(fields: ChatLogFields) {
  logger.info(fields, "chat_processed");
}

export function logPipelineEvent(event: string, fields: Record<string, unknown>) {
  logger.info(fields, event);
}
