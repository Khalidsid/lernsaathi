import type { MistakeType } from "@/lib/pipeline/taxonomy";

export type MistakePriority = "high" | "medium" | "low";

const FUNDAMENTAL_MISTAKE_TYPES = new Set<MistakeType>([
  "article_gender_confusion",
  "case_confusion",
  "verb_form_confusion",
  "word_order_confusion",
]);

const LOW_PRIORITY_MISTAKE_TYPES = new Set<MistakeType>(["formality_register_confusion"]);

export function assignMistakePriority(mistakeType: MistakeType, openMistakesOfSameType: number): MistakePriority {
  if (FUNDAMENTAL_MISTAKE_TYPES.has(mistakeType) || openMistakesOfSameType >= 2) {
    return "high";
  }

  if (LOW_PRIORITY_MISTAKE_TYPES.has(mistakeType)) {
    return "low";
  }

  return "medium";
}
