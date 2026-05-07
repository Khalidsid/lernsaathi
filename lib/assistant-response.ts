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

export type StructuredAssistantContent = {
  lemma?: StructuredLemma | null;
  examples?: StructuredExample[] | null;
  use?: string | null;
  pattern?: string | null;
  common?: string | null;
  note?: string | null;
};
