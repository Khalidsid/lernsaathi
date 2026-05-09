import { forwardRef } from "react";

import { BilingualPair } from "@/components/BilingualPair";
import { ChhotaCheck } from "@/components/ChhotaCheck";
import { LemmaAnchor } from "@/components/LemmaAnchor";
import { ReflectionCard } from "@/components/ReflectionCard";
import { cn } from "@/lib/cn";

import type { StructuredAssistantContent } from "@/lib/assistant-response";

export type AssistantAttemptKind = "reflection" | "chhota_check";

type AssistantBlockProps = React.HTMLAttributes<HTMLDivElement> & {
  eventId?: string;
  isAttemptDisabled?: boolean;
  label?: string;
  onAttempt?: (parentEventId: string, value: string, kind: AssistantAttemptKind) => Promise<void>;
  response: string;
  structured?: StructuredAssistantContent | null;
  verificationPrompt?: string | null;
};

function labelText(label?: string) {
  return label ? label.toLocaleLowerCase("de-DE") : null;
}

export const AssistantBlock = forwardRef<HTMLDivElement, AssistantBlockProps>(function AssistantBlock(
  { className, eventId, isAttemptDisabled = false, label, onAttempt, response, structured, verificationPrompt, ...props },
  ref,
) {
  const hasStructured = Boolean(structured?.lemma || structured?.examples?.length || structured?.use || structured?.pattern);
  const lemma = structured?.lemma;
  const reflection = structured?.reflection;

  return (
    <div className={cn("max-w-[92%]", className)} ref={ref} {...props}>
      {labelText(label) ? (
        <div className="serif mb-1.5 text-[12px] lowercase italic tracking-wide text-ink3 dark:text-ink4">
          {labelText(label)}
        </div>
      ) : null}
      <div className="assistant-bg fade-in rounded-2xl rounded-tl-md px-4 py-4 dark:bg-[#232825]">
        {reflection ? (
          <div>
            {structured?.intro ? (
              <p className="mb-3 text-[14.5px] leading-[1.65] text-ink2 dark:text-[#CFCDC4]">{structured.intro}</p>
            ) : null}
            <ReflectionCard
              corrected={reflection.corrected}
              disabled={isAttemptDisabled}
              explanation={reflection.explanation}
              friction={reflection.friction}
              onAttempt={
                eventId && onAttempt
                  ? (value) => onAttempt(eventId, value, "reflection")
                  : undefined
              }
              original={reflection.original}
              question={reflection.question}
            />
            {verificationPrompt ? (
              <ChhotaCheck
                disabled={isAttemptDisabled}
                onReply={
                  eventId && onAttempt
                    ? (value) => onAttempt(eventId, value, "chhota_check")
                    : undefined
                }
                prompt={verificationPrompt}
              />
            ) : null}
          </div>
        ) : hasStructured ? (
          <div>
            {structured?.intro ? (
              <p className="mb-3 text-[14.5px] leading-[1.65] text-ink2 dark:text-[#CFCDC4]">{structured.intro}</p>
            ) : null}
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

            {structured?.priorMistakeReminder ? (
              <p className="mt-4 text-[14.5px] leading-[1.6] text-ink2 dark:text-[#CFCDC4]">
                {structured.priorMistakeReminder}
              </p>
            ) : null}

            {verificationPrompt ? (
              <ChhotaCheck
                disabled={isAttemptDisabled}
                onReply={
                  eventId && onAttempt
                    ? (value) => onAttempt(eventId, value, "chhota_check")
                    : undefined
                }
                prompt={verificationPrompt}
              />
            ) : null}
          </div>
        ) : (
          <div>
            <div className="whitespace-pre-wrap text-[15px] leading-[1.65] text-ink2 dark:text-[#CFCDC4]">{response}</div>
            {verificationPrompt ? (
              <ChhotaCheck
                disabled={isAttemptDisabled}
                onReply={
                  eventId && onAttempt
                    ? (value) => onAttempt(eventId, value, "chhota_check")
                    : undefined
                }
                prompt={verificationPrompt}
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
});
