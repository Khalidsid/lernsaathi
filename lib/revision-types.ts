export type RevisionRating = "again" | "good";

export type RevisionCardData = {
  back: string;
  explanation?: string | null;
  front: string;
  id: string;
  learnerVisibleLabel: string;
  reviewCount: number;
};

export type MistakeListItem = {
  day: string;
  gloss: string;
  id: string;
  lemma: string;
  priority: string;
  status: "open" | "inRevision" | "settled";
};

export type MistakeGroup = {
  id: string;
  items: MistakeListItem[];
  label: string;
};
