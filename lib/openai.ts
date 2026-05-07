import OpenAI from "openai";

import { db } from "@/lib/db";
import { logPipelineEvent } from "@/lib/logging";

const OPENAI_MODEL = "gpt-5";
const DAILY_LIMIT_MESSAGE = "Aaj ka limit khatam ho gaya hai. Kal try karein.";
const INPUT_COST_PER_MILLION = 1.25;
const OUTPUT_COST_PER_MILLION = 10;

type JsonSchema = Record<string, unknown>;

type ResponseMeta = {
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number;
};

export class DailySpendCapError extends Error {
  constructor() {
    super("Daily spend cap reached");
  }
}

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  return new OpenAI({ apiKey });
}

function getDailyCapUsd() {
  return Number(process.env.DAILY_SPEND_CAP_USD ?? "2.00");
}

function getDayStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function estimateCostUsd(inputTokens: number, outputTokens: number) {
  return (inputTokens / 1_000_000) * INPUT_COST_PER_MILLION + (outputTokens / 1_000_000) * OUTPUT_COST_PER_MILLION;
}

async function assertDailySpendAvailable() {
  const sums = await db.learningEvent.aggregate({
    _sum: {
      llmTokensIn: true,
      llmTokensOut: true,
    },
    where: {
      createdAt: {
        gte: getDayStart(),
      },
    },
  });

  const inputTokens = sums._sum.llmTokensIn ?? 0;
  const outputTokens = sums._sum.llmTokensOut ?? 0;
  const currentSpend = estimateCostUsd(inputTokens, outputTokens);

  if (currentSpend >= getDailyCapUsd()) {
    logPipelineEvent("daily_spend_cap_reached", {
      currentSpend,
      capUsd: getDailyCapUsd(),
    });
    throw new DailySpendCapError();
  }
}

function getUsageValue(usage: unknown, keys: string[]) {
  if (!usage || typeof usage !== "object") {
    return null;
  }

  for (const key of keys) {
    const candidate = Reflect.get(usage, key);
    if (typeof candidate === "number") {
      return candidate;
    }
  }

  return null;
}

export async function runStructuredPrompt<T>({
  systemPrompt,
  userPrompt,
  schemaName,
  schema,
}: {
  systemPrompt: string;
  userPrompt: string;
  schemaName: string;
  schema: JsonSchema;
}) {
  await assertDailySpendAvailable();

  const client = getClient();
  const startedAt = Date.now();
  logPipelineEvent("llm_stage_start", {
    schemaName,
    model: OPENAI_MODEL,
  });
  const response = await client.responses.create({
    model: OPENAI_MODEL,
    reasoning: {
      effort: "minimal",
    },
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: systemPrompt }],
      },
      {
        role: "user",
        content: [{ type: "input_text", text: userPrompt }],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: schemaName,
        schema,
        strict: true,
      },
    },
  });

  const responseText = response.output_text;

  if (!responseText) {
    throw new Error("OpenAI response was empty");
  }

  const usage = response.usage;

  const meta: ResponseMeta = {
    model: response.model ?? OPENAI_MODEL,
    inputTokens: getUsageValue(usage, ["input_tokens", "prompt_tokens"]),
    outputTokens: getUsageValue(usage, ["output_tokens", "completion_tokens"]),
    latencyMs: Date.now() - startedAt,
  };

  logPipelineEvent("llm_stage_complete", {
    schemaName,
    model: meta.model,
    inputTokens: meta.inputTokens,
    outputTokens: meta.outputTokens,
    latencyMs: meta.latencyMs,
  });

  return {
    data: JSON.parse(responseText) as T,
    meta,
  };
}

export function getDailyLimitMessage() {
  return DAILY_LIMIT_MESSAGE;
}
