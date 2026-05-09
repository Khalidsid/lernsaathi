import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

import type { NextResponse } from "next/server";

type IdempotencyResult =
  | { kind: "missing" }
  | { kind: "hash_mismatch" }
  | { kind: "replay"; payload: unknown; statusCode: number };

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
}

export function buildIdempotencyHash(payload: unknown) {
  return stableStringify(payload);
}

export async function getIdempotencyResult({
  key,
  requestHash,
  route,
  userId,
}: {
  key: string | null;
  requestHash: string;
  route: string;
  userId: string;
}): Promise<IdempotencyResult> {
  if (!key) {
    return { kind: "missing" };
  }

  const existing = await db.idempotencyRequest.findUnique({
    where: {
      userId_route_key: {
        userId,
        route,
        key,
      },
    },
    select: {
      requestHash: true,
      response: true,
      statusCode: true,
    },
  });

  if (!existing) {
    return { kind: "missing" };
  }

  if (existing.requestHash !== requestHash) {
    return { kind: "hash_mismatch" };
  }

  return {
    kind: "replay",
    payload: existing.response,
    statusCode: existing.statusCode,
  };
}

export async function storeIdempotencyResponse({
  key,
  requestHash,
  response,
  route,
  statusCode,
  userId,
}: {
  key: string | null;
  requestHash: string;
  response: unknown;
  route: string;
  statusCode: number;
  userId: string;
}) {
  if (!key) {
    return;
  }

  try {
    await db.idempotencyRequest.create({
      data: {
        userId,
        route,
        key,
        requestHash,
        statusCode,
        response: response as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
      throw error;
    }
  }
}

export function getIdempotencyKey(request: Request) {
  const header = request.headers.get("x-idempotency-key")?.trim() ?? "";
  return header || null;
}

export function replayToJsonResponse(result: Extract<IdempotencyResult, { kind: "replay" }>, json: typeof NextResponse.json) {
  return json(result.payload, { status: result.statusCode });
}
