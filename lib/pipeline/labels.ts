export const LEARNER_VISIBLE_LABELS = {
  writing: "Schreiben Schritt für Schritt",
  speaking: "Sprechen üben",
  reading: "Text verstehen",
  listening: "Audio verstehen",
  task_instruction_decoding: "Aufgabe verstehen",
  grammar_accuracy: "Satz richtig machen",
  vocabulary_in_context: "Wörter verstehen",
  revision: "Wiederholen, was schwer war",
  picture_speaking: "Bild beschreiben",
  answer_strategy: "Antwort finden",
} as const;

export function getLearnerVisibleLabelForEvent(inputType: string) {
  if (inputType === "out_of_scope") {
    return LEARNER_VISIBLE_LABELS.task_instruction_decoding;
  }

  if (inputType === "daily_limit_reached") {
    return LEARNER_VISIBLE_LABELS.vocabulary_in_context;
  }

  if (inputType === "grammar_question" || inputType === "sentence_correction") {
    return LEARNER_VISIBLE_LABELS.grammar_accuracy;
  }

  return LEARNER_VISIBLE_LABELS.vocabulary_in_context;
}
