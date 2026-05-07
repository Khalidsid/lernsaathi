"use client";

import { forwardRef } from "react";
import { signOut } from "next-auth/react";
import { MoreHorizontal } from "lucide-react";

import { TabBar } from "@/components/TabBar";
import { cn } from "@/lib/cn";

import type { ChatTab } from "@/components/TabBar";

type AppShellProps = React.HTMLAttributes<HTMLDivElement> & {
  activeTab: ChatTab;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppShell(
  { activeTab, children, className, footer, ...props },
  ref,
) {
  return (
    <div
      className={cn(
        "mx-auto flex min-h-screen w-full max-w-3xl flex-col bg-paper text-ink shadow-[0_30px_80px_-35px_rgba(40,40,40,0.28)] dark:bg-night dark:text-mist sm:my-6 sm:min-h-[calc(100vh-3rem)] sm:rounded-2xl sm:border sm:border-rule dark:sm:border-[#2E2E2B]",
        className,
      )}
      ref={ref}
      {...props}
    >
      <header>
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <div className="serif text-[18px] tracking-[-0.005em] text-ink dark:text-mist">Lernsaathi</div>
          <button
            aria-label="Logout"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink3 transition hover:bg-paper2 hover:text-ink dark:text-ink4 dark:hover:bg-night3 dark:hover:text-mist"
            onClick={() => signOut({ callbackUrl: "/login" })}
            type="button"
          >
            <MoreHorizontal aria-hidden="true" size={18} strokeWidth={2} />
          </button>
        </div>
        <div className="px-5 pb-3">
          <TabBar activeTab={activeTab} />
        </div>
        <div className="hairline dark:bg-[#2E2E2B]" />
      </header>

      <div className="min-h-0 flex-1">{children}</div>
      {footer ? <div className="px-4 pb-5">{footer}</div> : null}
    </div>
  );
});
