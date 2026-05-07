export type ResponseDepth = "quick_answer" | "guided_explanation" | "full_diagnostic";

type DepthInputType =
  | "word_query"
  | "phrase_query"
  | "grammar_question"
  | "sentence_correction"
  | "out_of_scope"
  | "daily_limit_reached";

export type OpenMistakeSignal = {
  id: string;
};

export function selectResponseDepth(
  inputType: DepthInputType,
  _classification: { depthHint: ResponseDepth },
  openMistakesForLemma: OpenMistakeSignal[] = [],
): ResponseDepth {
  if (inputType === "out_of_scope" || inputType === "daily_limit_reached") {
    return "quick_answer";
  }

  if (inputType === "grammar_question" || inputType === "sentence_correction") {
    return "guided_explanation";
  }

  if ((inputType === "word_query" || inputType === "phrase_query") && openMistakesForLemma.length > 0) {
    return "guided_explanation";
  }

  return "quick_answer";
}
