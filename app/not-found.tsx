import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-paper px-5 text-ink dark:bg-night dark:text-mist">
      <section className="w-full max-w-[380px] rounded-2xl border border-rule bg-paper2 p-5 shadow-[0_18px_45px_-32px_rgba(31,31,31,0.45)] dark:border-[#2E2E2B] dark:bg-night2">
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-ink4">404</p>
        <h1 className="serif mt-2 text-[28px] leading-[1.15] text-ink dark:text-mist">
          This page does not exist.
        </h1>
        <p className="mt-3 text-[14px] leading-[1.6] text-ink3 dark:text-ink4">
          Link galat ho sakta hai. Chat par wapas jaakar learning continue karein.
        </p>
        <Link
          className="mt-5 inline-flex rounded-xl bg-teal px-4 py-3 text-[14px] font-medium text-paper transition hover:bg-tealDk active-press dark:bg-tealLt2 dark:text-night dark:hover:bg-teal"
          href="/chat"
        >
          Back to chat
        </Link>
      </section>
    </main>
  );
}
