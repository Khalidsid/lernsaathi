export default function Loading() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-paper px-5 text-ink dark:bg-night dark:text-mist">
      <div
        aria-busy="true"
        aria-live="polite"
        className="w-full max-w-[360px] rounded-2xl border border-rule bg-paper2 p-5 shadow-[0_18px_45px_-32px_rgba(31,31,31,0.45)] dark:border-[#2E2E2B] dark:bg-night2"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="serif text-[18px] text-ink dark:text-mist">Lernsaathi</div>
          <div className="h-2 w-2 rounded-full bg-teal dark:bg-tealLt2" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-28 rounded bg-rule animate-shimmer dark:bg-night3" />
          <div className="h-20 rounded-xl bg-rule2 animate-shimmer dark:bg-night3" />
          <div className="h-10 rounded-xl bg-rule2 animate-shimmer dark:bg-night3" />
        </div>
        <p className="mt-4 text-[13px] text-ink3 dark:text-ink4">Loading...</p>
      </div>
    </main>
  );
}
