export type StructuredLemma = {
  article?: "der" | "die" | "das" | null;
  word: string;
  plural?: string | null;
  gloss: string;
};

export type StructuredExample = {
  de: string;
  hi: string;
};

export type StructuredDiagnosisItem = {
  mistakeType: string;
  topic?: string | null;
  subtype?: string | null;
  friction?: string | null;
  correctForm?: string | null;
  explanation?: string | null;
  hiddenExamImpact?: string[] | null;
  likelyTransferContexts?: string[] | null;
};

export type StructuredReflection = {
  original: string;
  friction: string;
  question: string;
  corrected: string;
  explanation: string;
};

export type StructuredAssistantContent = {
  intro?: string | null;
  lemma?: StructuredLemma | null;
  examples?: StructuredExample[] | null;
  use?: string | null;
  pattern?: string | null;
  common?: string | null;
  note?: string | null;
  diagnosis?: StructuredDiagnosisItem[] | null;
  reflection?: StructuredReflection | null;
  priorMistakeReminder?: string | null;
};
