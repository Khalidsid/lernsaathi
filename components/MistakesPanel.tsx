import { MistakeRow } from "@/components/MistakeRow";

import type { MistakeGroup } from "@/lib/revision-types";

type MistakesPanelProps = {
  groups: MistakeGroup[];
};

function EmptyMistakesState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-10 text-center">
      <div className="serif text-[28px] leading-[1.2] text-ink dark:text-mist">Abhi koi saved pattern nahi hai.</div>
      <p className="mt-4 max-w-xs text-[15px] leading-[1.7] text-ink3 dark:text-ink4">
        Jab koi grammar ya sentence pattern mushkil hoga, woh yahan dikhega.
      </p>
    </div>
  );
}

export function MistakesPanel({ groups }: MistakesPanelProps) {
  if (groups.length === 0) {
    return <EmptyMistakesState />;
  }

  return (
    <div className="h-full overflow-y-auto pb-6">
      <div className="px-5 pb-2 pt-5">
        <div className="serif text-[20px] leading-tight text-ink dark:text-mist">Patterns to revisit</div>
        <p className="mt-1 text-[13px] leading-[1.55] text-ink3 dark:text-ink4">
          Active dots sabse pehle revise honge; light dots settle ho chuke hain.
        </p>
      </div>

      {groups.map((group) => (
        <section key={group.id}>
          <div className="px-5 pb-2 pt-4">
            <div className="serif text-[12px] lowercase italic text-ink3 dark:text-ink4">{group.label}</div>
          </div>
          <ul className="px-3">
            {group.items.map((item) => (
              <MistakeRow
                day={item.day}
                gloss={item.gloss}
                key={item.id}
                lemma={item.lemma}
                status={item.status}
                title={`${item.lemma}: ${item.gloss}`}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
