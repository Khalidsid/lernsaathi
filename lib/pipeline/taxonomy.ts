export const MISTAKE_TYPES = [
  "task_instruction_confusion",
  "situation_context_confusion",
  "word_meaning",
  "phrase_meaning",
  "article_gender_confusion",
  "case_confusion",
  "verb_form_confusion",
  "word_order_confusion",
  "formality_register_confusion",
  "writing_structure_confusion",
  "speaking_structure_confusion",
  "visual_observation_failure",
  "exam_strategy_failure",
  "retention_failure",
  "confidence_freeze_failure",
  "transfer_failure",
] as const;

export type MistakeType = (typeof MISTAKE_TYPES)[number];
