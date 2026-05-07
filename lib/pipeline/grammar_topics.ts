import type { MistakeType } from "@/lib/pipeline/taxonomy";

export const CORE_GRAMMAR_TOPICS = [
  "case_akkusativ_dativ",
  "wechselpraepositionen",
  "verb_position_v2",
  "modal_verbs",
  "perfekt_aux_choice",
  "separable_verbs",
  "reflexive_verbs",
  "article_gender",
] as const;

export type CoreGrammarTopic = (typeof CORE_GRAMMAR_TOPICS)[number];

export const GRAMMAR_TOPIC_TO_MISTAKE_TYPES: Record<CoreGrammarTopic, MistakeType[]> = {
  case_akkusativ_dativ: ["case_confusion"],
  wechselpraepositionen: ["case_confusion"],
  verb_position_v2: ["word_order_confusion"],
  modal_verbs: ["verb_form_confusion"],
  perfekt_aux_choice: ["verb_form_confusion"],
  separable_verbs: ["word_order_confusion", "verb_form_confusion"],
  reflexive_verbs: ["verb_form_confusion", "case_confusion"],
  article_gender: ["article_gender_confusion"],
};

export const GRAMMAR_TOPIC_TO_EXAM_IMPACT: Record<CoreGrammarTopic, string[]> = {
  case_akkusativ_dativ: ["grammar_accuracy.cases", "writing.simple_sentence_accuracy"],
  wechselpraepositionen: ["grammar_accuracy.cases", "writing.simple_sentence_accuracy"],
  verb_position_v2: ["grammar_accuracy.word_order", "writing.simple_sentence_accuracy"],
  modal_verbs: ["grammar_accuracy.verb_forms", "writing.simple_sentence_accuracy"],
  perfekt_aux_choice: ["grammar_accuracy.verb_forms", "writing.simple_sentence_accuracy"],
  separable_verbs: ["grammar_accuracy.word_order", "grammar_accuracy.verb_forms"],
  reflexive_verbs: ["grammar_accuracy.verb_forms", "grammar_accuracy.cases"],
  article_gender: ["grammar_accuracy.articles", "writing.simple_sentence_accuracy"],
};

export function isCoreGrammarTopic(value: string): value is CoreGrammarTopic {
  return CORE_GRAMMAR_TOPICS.includes(value as CoreGrammarTopic);
}

export function getMistakeTypesForGrammarTopic(topic: CoreGrammarTopic) {
  return GRAMMAR_TOPIC_TO_MISTAKE_TYPES[topic];
}

export function getExamImpactForGrammarTopic(topic: CoreGrammarTopic) {
  return GRAMMAR_TOPIC_TO_EXAM_IMPACT[topic];
}
