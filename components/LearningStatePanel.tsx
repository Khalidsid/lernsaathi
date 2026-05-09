"use client";

/**
 * Slice 3.8: Learning State Panel
 *
 * Displays current learning progress:
 * - Due revision count (with call-to-action)
 * - Active mistake count
 * - Today's completed review count
 *
 * Features:
 * - Skeleton loading states
 * - Animated count transitions
 * - Empty state guidance
 */

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

type LearningState = {
  dueRevisions: number;
  activeMistakes: number;
  todayReviews: number;
  timestamp: string;
};

export function LearningStatePanel() {
  const [state, setState] = useState<LearningState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function fetchState() {
    try {
      setLoading(true);
      setError(false);
      const response = await fetch("/api/learning-state");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setState(data);
    } catch (err) {
      console.error("Error fetching learning state:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchState();
  }, []);

  if (loading) {
    return <LearningStateSkeleton />;
  }

  if (error || !state) {
    return (
      <div className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Failed to load learning state.
        </p>
        <button
          onClick={fetchState}
          className="mt-2 text-sm text-accent hover:underline flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          Retry
        </button>
      </div>
    );
  }

  const hasActivity = state.dueRevisions > 0 || state.activeMistakes > 0 || state.todayReviews > 0;

  return (
    <div
      aria-live="polite"
      className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 space-y-3 animate-fade-in"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Today's Progress
        </h2>
        <button
          onClick={fetchState}
          className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors active-press"
          aria-label="Refresh"
        >
          <RefreshCw aria-hidden="true" className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
        </button>
      </div>

      {!hasActivity ? (
        <div className="py-6 text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
            Start by writing some German below 👇
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {/* Due Revisions */}
          <StateCard
            count={state.dueRevisions}
            label="Due"
            variant={state.dueRevisions > 0 ? "accent" : "neutral"}
            href={state.dueRevisions > 0 ? "/chat?tab=revision" : undefined}
          />

          {/* Active Mistakes */}
          <StateCard
            count={state.activeMistakes}
            label="Active"
            variant="neutral"
            href="/chat?tab=mistakes"
          />

          {/* Today's Reviews */}
          <StateCard
            count={state.todayReviews}
            label="Done"
            variant="success"
          />
        </div>
      )}
    </div>
  );
}

function StateCard({
  count,
  label,
  variant = "neutral",
  href,
}: {
  count: number;
  label: string;
  variant?: "accent" | "neutral" | "success";
  href?: string;
}) {
  const [displayCount, setDisplayCount] = useState(count);
  const [prevCount, setPrevCount] = useState(count);

  useEffect(() => {
    if (count !== prevCount) {
      setPrevCount(displayCount);
      // Animate count change
      const duration = 300;
      const startTime = Date.now();
      const startValue = displayCount;
      const endValue = count;

      const animate = () => {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const current = Math.round(startValue + (endValue - startValue) * eased);
        setDisplayCount(current);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [count, prevCount, displayCount]);

  const variantClasses = {
    accent: "bg-accent-lt dark:bg-accent/10 text-accent-dk dark:text-accent",
    neutral: "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300",
    success: "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400",
  };

  const content = (
    <>
      <div className="text-2xl font-bold tabular-nums">{displayCount}</div>
      <div className="text-xs mt-0.5 opacity-70">{label}</div>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={`block rounded-md p-3 text-center transition-all ${variantClasses[variant]} hover:opacity-80 active-press`}
      >
        {content}
      </a>
    );
  }

  return (
    <div className={`rounded-md p-3 text-center transition-all ${variantClasses[variant]}`}>
      {content}
    </div>
  );
}

function LearningStateSkeleton() {
  return (
    <div
      aria-busy="true"
      className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded animate-shimmer" />
        <div className="w-6 h-6 bg-neutral-200 dark:bg-neutral-800 rounded animate-shimmer" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-md bg-neutral-100 dark:bg-neutral-800 p-3 h-20 animate-shimmer"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
