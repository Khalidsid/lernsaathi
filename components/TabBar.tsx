import Link from "next/link";
import { forwardRef } from "react";

import { cn } from "@/lib/cn";

export type ChatTab = "chat" | "revision" | "mistakes";

const tabs: Array<{ id: ChatTab; label: string; href: string }> = [
  { id: "chat", label: "Baatcheet", href: "/chat" },
  { id: "revision", label: "Dohraana", href: "/chat?tab=revision" },
  { id: "mistakes", label: "Galtiyan", href: "/chat?tab=mistakes" },
];

type TabBarProps = React.HTMLAttributes<HTMLDivElement> & {
  activeTab: ChatTab;
};

export const TabBar = forwardRef<HTMLDivElement, TabBarProps>(function TabBar(
  { activeTab, className, ...props },
  ref,
) {
  return (
    <nav className={cn("flex items-center gap-1.5", className)} ref={ref} {...props} aria-label="Chat tabs">
      {tabs.map((tab) => (
        <Link
          className={cn(
            "tabpill text-ink3 transition hover:bg-paper2 hover:text-ink2 dark:text-ink4 dark:hover:bg-night3 dark:hover:text-mist",
            tab.id === activeTab && "border border-rule bg-paper2 text-ink dark:border-[#2E2E2B] dark:bg-night2 dark:text-mist",
          )}
          href={tab.href}
          key={tab.id}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
});
