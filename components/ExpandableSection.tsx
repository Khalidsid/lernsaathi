"use client";

/**
 * Expandable detail section for assistant responses
 *
 * Provides collapsible sections for:
 * - Additional details
 * - Grammar explanations
 * - German language fundamentals
 */

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type ExpandableSectionProps = {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  variant?: "detail" | "grammar" | "fundamentals";
};

export function ExpandableSection({
  title,
  children,
  defaultExpanded = false,
  variant = "detail",
}: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const variantStyles = {
    detail: {
      border: "border-blue-200 dark:border-blue-800",
      bg: "bg-blue-50 dark:bg-blue-950/20",
      text: "text-blue-900 dark:text-blue-200",
      icon: "text-blue-600 dark:text-blue-400",
    },
    grammar: {
      border: "border-purple-200 dark:border-purple-800",
      bg: "bg-purple-50 dark:bg-purple-950/20",
      text: "text-purple-900 dark:text-purple-200",
      icon: "text-purple-600 dark:text-purple-400",
    },
    fundamentals: {
      border: "border-green-200 dark:border-green-800",
      bg: "bg-green-50 dark:bg-green-950/20",
      text: "text-green-900 dark:text-green-200",
      icon: "text-green-600 dark:text-green-400",
    },
  };

  const style = variantStyles[variant];

  return (
    <div className={`my-3 rounded-lg border ${style.border} overflow-hidden`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors ${style.bg} hover:opacity-80 active-press`}
        type="button"
        aria-expanded={isExpanded}
      >
        <span className={`text-sm font-medium ${style.text}`}>{title}</span>
        {isExpanded ? (
          <ChevronUp className={`h-4 w-4 ${style.icon}`} aria-hidden="true" />
        ) : (
          <ChevronDown className={`h-4 w-4 ${style.icon}`} aria-hidden="true" />
        )}
      </button>
      {isExpanded ? (
        <div className={`animate-fade-in px-4 py-3 text-sm ${style.text} border-t ${style.border}`}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
