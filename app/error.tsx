"use client";

import Link from "next/link";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-paper px-5 text-ink dark:bg-night dark:text-mist">
      <section className="w-full max-w-[380px] rounded-2xl border border-rule bg-paper2 p-5 shadow-[0_18px_45px_-32px_rgba(31,31,31,0.45)] dark:border-[#2E2E2B] dark:bg-night2">
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-ink4">Recovery</p>
        <h1 className="serif mt-2 text-[28px] leading-[1.15] text-ink dark:text-mist">
          Couldn&apos;t load this screen.
        </h1>
        <p className="mt-3 text-[14px] leading-[1.6] text-ink3 dark:text-ink4">
          Connection issue ho sakta hai. Retry karein, ya chat par wapas ja sakte hain.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            className="rounded-xl bg-teal px-4 py-3 text-[14px] font-medium text-paper transition hover:bg-tealDk active-press dark:bg-tealLt2 dark:text-night dark:hover:bg-teal"
            onClick={reset}
            type="button"
          >
            Retry
          </button>
          <Link
            className="rounded-xl border border-rule bg-paper px-4 py-3 text-center text-[14px] font-medium text-ink2 transition hover:border-teal hover:bg-tealLt active-press dark:border-[#2E2E2B] dark:bg-night dark:text-mist dark:hover:border-tealLt2 dark:hover:bg-tealNight/35"
            href="/chat"
          >
            Back to chat
          </Link>
        </div>
      </section>
    </main>
  );
}
