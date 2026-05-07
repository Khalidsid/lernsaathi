import { db } from "@/lib/db";
import { DEFAULT_EXAM_READINESS_SKILLS } from "@/lib/exam-map";
import { updateExamReadinessSkills } from "@/lib/pipeline/exam_map";
import { getExamImpactForGrammarTopic, isCoreGrammarTopic } from "@/lib/pipeline/grammar_topics";
import { assignMistakePriority } from "@/lib/pipeline/mistake_priority";
import { MISTAKE_TYPES } from "@/lib/pipeline/taxonomy";

import type { StructuredDiagnosisItem } from "@/lib/assistant-response";
import type { MistakeType } from "@/lib/pipeline/taxonomy";

function isMistakeType(value: string): value is MistakeType {
  return MISTAKE_TYPES.includes(value as MistakeType);
}

function getHiddenExamImpact(candidate: StructuredDiagnosisItem) {
  if (candidate.hiddenExamImpact?.length) {
    return candidate.hiddenExamImpact;
  }

  if (candidate.topic && isCoreGrammarTopic(candidate.topic)) {
    return getExamImpactForGrammarTopic(candidate.topic);
  }

  return ["grammar_accuracy"];
}

async function updateExamMap(userId: string, hiddenExamImpact: string[]) {
  const existing = await db.examReadinessMap.findUnique({
    where: { userId },
    select: { skills: true },
  });
  const currentSkills = existing?.skills ?? DEFAULT_EXAM_READINESS_SKILLS;
  const skills = updateExamReadinessSkills(currentSkills, hiddenExamImpact);

  await db.examReadinessMap.upsert({
    where: { userId },
    create: {
      userId,
      skills,
    },
    update: {
      skills,
    },
  });
}

export async function createMistakesFromCandidates({
  candidates,
  inputType,
  rawInput,
  response,
  sourceEventId,
  userId,
}: {
  candidates: StructuredDiagnosisItem[];
  inputType: string;
  rawInput: string;
  response: string;
  sourceEventId: string;
  userId: string;
}) {
  if (inputType !== "grammar_question" && inputType !== "sentence_correction") {
    return [];
  }

  const createdIds: string[] = [];

  for (const candidate of candidates) {
    if (!candidate.mistakeType || !isMistakeType(candidate.mistakeType)) {
      continue;
    }

    if (inputType === "grammar_question" && candidate.topic && !isCoreGrammarTopic(candidate.topic)) {
      continue;
    }

    const existing = await db.mistake.findFirst({
      where: {
        userId,
        mistakeType: candidate.mistakeType,
        OR: [
          { status: "active" },
          { status: "settled" },
          { status: "mastered" },
        ],
        exampleInput: rawInput,
      },
      select: { id: true, status: true },
    });

    if (existing) {
      continue;
    }

    const openMistakesOfSameType = await db.mistake.count({
      where: {
        userId,
        mistakeType: candidate.mistakeType,
        status: "active",
      },
    });
    const hiddenExamImpact = getHiddenExamImpact(candidate);
    const mistake = await db.mistake.create({
      data: {
        userId,
        sourceEventId,
        mistakeType: candidate.mistakeType,
        subtype: candidate.subtype,
        exampleInput: rawInput,
        correctForm: inputType === "sentence_correction" ? candidate.correctForm || "" : "",
        explanationGiven: candidate.explanation || response,
        priority: assignMistakePriority(candidate.mistakeType, openMistakesOfSameType),
        hiddenExamImpact,
        likelyTransferContexts: candidate.likelyTransferContexts ?? [],
        status: "active",
      },
      select: { id: true },
    });

    await updateExamMap(userId, hiddenExamImpact);
    createdIds.push(mistake.id);
  }

  return createdIds;
}

export async function markMistakesReviewed(mistakeIds: string[]) {
  if (mistakeIds.length === 0) {
    return;
  }

  await db.mistake.updateMany({
    where: {
      id: { in: mistakeIds },
      status: "active",
    },
    data: {
      reviewCount: {
        increment: 1,
      },
      lastReviewedAt: new Date(),
    },
  });
}
