import { forwardRef } from "react";

import { BilingualPair } from "@/components/BilingualPair";
import { LemmaAnchor } from "@/components/LemmaAnchor";
import { cn } from "@/lib/cn";

import type { StructuredAssistantContent } from "@/lib/assistant-response";

type AssistantBlockProps = React.HTMLAttributes<HTMLDivElement> & {
  label?: string;
  response: string;
  structured?: StructuredAssistantContent | null;
};

function labelText(label?: string) {
  return label ? label.toLocaleLowerCase("de-DE") : null;
}

export const AssistantBlock = forwardRef<HTMLDivElement, AssistantBlockProps>(function AssistantBlock(
  { className, label, response, structured, ...props },
  ref,
) {
  const hasStructured = Boolean(structured?.lemma || structured?.examples?.length || structured?.use || structured?.pattern);
  const lemma = structured?.lemma;

  return (
    <div className={cn("max-w-[92%]", className)} ref={ref} {...props}>
      {labelText(label) ? (
        <div className="serif mb-1.5 text-[12px] lowercase italic tracking-wide text-ink3 dark:text-ink4">
          {labelText(label)}
        </div>
      ) : null}
      <div className="assistant-bg fade-in rounded-2xl rounded-tl-md px-4 py-4 dark:bg-[#232825]">
        {hasStructured ? (
          <div>
            {lemma ? (
              <div>
                <LemmaAnchor className="text-[22px] text-ink dark:text-mist">
                  {[lemma.article, lemma.word].filter(Boolean).join(" ")}
                </LemmaAnchor>
                <div className="mt-1 text-[15px] leading-[1.55] text-ink2 dark:text-[#CFCDC4]">{lemma.gloss}</div>
                {lemma.plural ? <div className="mono mt-2 text-[11px] text-ink4">Plural: {lemma.plural}</div> : null}
              </div>
            ) : null}

            {structured?.examples?.length ? (
              <div className="mt-4">
                <div className="serif mb-1.5 text-[12px] lowercase text-ink3 dark:text-ink4">example</div>
                <div className="space-y-3">
                  {structured.examples.map((example) => (
                    <BilingualPair de={example.de} hi={example.hi} key={`${example.de}-${example.hi}`} />
                  ))}
                </div>
              </div>
            ) : null}

            {structured?.use ? (
              <div className="mt-4">
                <div className="serif mb-1.5 text-[12px] lowercase text-ink3 dark:text-ink4">use</div>
                <p className="text-[14.5px] leading-[1.6] text-ink2 dark:text-[#CFCDC4]">{structured.use}</p>
              </div>
            ) : null}

            {structured?.pattern ? (
              <div className="mt-4">
                <div className="serif mb-1.5 text-[12px] lowercase text-ink3 dark:text-ink4">pattern</div>
                <p className="whitespace-pre-wrap text-[14.5px] leading-[1.6] text-ink2 dark:text-[#CFCDC4]">
                  {structured.pattern}
                </p>
              </div>
            ) : null}

            {structured?.common ? (
              <p className="mt-4 text-[14.5px] leading-[1.6] text-ink2 dark:text-[#CFCDC4]">{structured.common}</p>
            ) : null}

            {structured?.note ? (
              <p className="mt-4 text-[14.5px] leading-[1.6] text-ink2 dark:text-[#CFCDC4]">{structured.note}</p>
            ) : null}
          </div>
        ) : (
          <div className="whitespace-pre-wrap text-[15px] leading-[1.65] text-ink2 dark:text-[#CFCDC4]">{response}</div>
        )}
      </div>
    </div>
  );
});
