"use client";

import { forwardRef, useEffect, useId, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { Check, LogOut, Monitor, Moon, MoreHorizontal, Sun } from "lucide-react";

import { TabBar } from "@/components/TabBar";
import { cn } from "@/lib/cn";

import type { ChatTab } from "@/components/TabBar";
import type { LucideIcon } from "lucide-react";

type ThemePreference = "system" | "light" | "dark";

type AppShellProps = React.HTMLAttributes<HTMLDivElement> & {
  activeTab: ChatTab;
  children: React.ReactNode;
  footer?: React.ReactNode;
  learningState?: React.ReactNode; // Slice 3.8: Optional learning state panel
};

const themeStorageKey = "lernsaathi-theme";

const themeOptions: Array<{
  id: ThemePreference;
  icon: LucideIcon;
  label: string;
}> = [
  { id: "system", icon: Monitor, label: "System" },
  { id: "light", icon: Sun, label: "Light" },
  { id: "dark", icon: Moon, label: "Dark" },
];

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(preference: ThemePreference) {
  const resolved = preference === "system" ? getSystemTheme() : preference;
  const root = document.documentElement;

  root.dataset.theme = resolved;
  root.dataset.themePreference = preference;
  root.style.colorScheme = resolved;
}

function getInitialThemePreference(): ThemePreference {
  if (typeof document === "undefined") {
    return "system";
  }

  const preference = document.documentElement.dataset.themePreference ?? null;
  return isThemePreference(preference) ? preference : "system";
}

function useThemePreference() {
  const [preference, setPreferenceState] = useState<ThemePreference>(getInitialThemePreference);

  useEffect(() => {
    let stored: string | null = null;

    try {
      stored = window.localStorage.getItem(themeStorageKey);
    } catch {
      stored = null;
    }

    const initialPreference = isThemePreference(stored) ? stored : "system";

    setPreferenceState(initialPreference);
    applyTheme(initialPreference);
  }, []);

  useEffect(() => {
    applyTheme(preference);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      if (preference === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, [preference]);

  function setPreference(nextPreference: ThemePreference) {
    setPreferenceState(nextPreference);

    try {
      window.localStorage.setItem(themeStorageKey, nextPreference);
    } catch {
      // localStorage can be unavailable in private or locked-down browser contexts.
    }

    applyTheme(nextPreference);
  }

  return { preference, setPreference };
}

export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppShell(
  { activeTab, children, className, footer, learningState, ...props },
  ref,
) {
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { preference, setPreference } = useThemePreference();

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <div
      className={cn(
        "mx-auto flex h-dvh min-h-dvh w-full max-w-[520px] flex-col overflow-hidden bg-paper text-ink shadow-[0_30px_80px_-35px_rgba(40,40,40,0.28)] dark:bg-night dark:text-mist sm:my-4 sm:h-[calc(100dvh-2rem)] sm:min-h-0 sm:rounded-2xl sm:border sm:border-rule dark:sm:border-[#2E2E2B]",
        className,
      )}
      ref={ref}
      {...props}
    >
      <header className="shrink-0">
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <div className="serif text-[18px] tracking-[-0.005em] text-ink dark:text-mist">Lernsaathi</div>
          <div className="relative" ref={menuRef}>
            <button
              aria-controls={menuId}
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink3 transition hover:bg-paper2 hover:text-ink dark:text-ink4 dark:hover:bg-night3 dark:hover:text-mist"
              onClick={() => setIsMenuOpen((current) => !current)}
              type="button"
            >
              <MoreHorizontal aria-hidden="true" size={18} strokeWidth={2} />
            </button>

            {isMenuOpen ? (
              <div
                className="fade-in absolute right-0 top-11 z-40 w-56 rounded-2xl border border-rule bg-paper p-2 shadow-[0_18px_45px_-18px_rgba(0,0,0,0.38)] dark:border-[#2E2E2B] dark:bg-night2"
                id={menuId}
                role="menu"
              >
                <div className="px-3 pb-1.5 pt-1 text-[11px] font-medium uppercase tracking-[0.08em] text-ink4">
                  Theme
                </div>
                <div className="space-y-1">
                  {themeOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = option.id === preference;

                    return (
                      <button
                        aria-checked={isSelected}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[14px] text-ink2 transition hover:bg-paper2 dark:text-[#CFCDC4] dark:hover:bg-night3",
                          isSelected && "bg-tealLt text-tealDk dark:bg-tealNight/35 dark:text-mist",
                        )}
                        key={option.id}
                        onClick={() => setPreference(option.id)}
                        role="menuitemradio"
                        type="button"
                      >
                        <Icon aria-hidden={true} size={15} strokeWidth={2} />
                        <span className="flex-1">{option.label}</span>
                        {isSelected ? <Check aria-hidden="true" size={15} strokeWidth={2.2} /> : null}
                      </button>
                    );
                  })}
                </div>
                <div className="my-2 h-px bg-rule dark:bg-[#2E2E2B]" />
                <button
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[14px] text-ink2 transition hover:bg-paper2 dark:text-[#CFCDC4] dark:hover:bg-night3"
                  onClick={() => {
                    setIsMenuOpen(false);
                    void signOut({ callbackUrl: "/login" });
                  }}
                  role="menuitem"
                  type="button"
                >
                  <LogOut aria-hidden="true" size={15} strokeWidth={2} />
                  <span>Sign out</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
        <div className="px-5 pb-3">
          <TabBar activeTab={activeTab} />
        </div>
        <div className="hairline dark:bg-[#2E2E2B]" />
      </header>

      {/* Slice 3.8: Optional learning state panel */}
      {learningState ? (
        <div className="shrink-0 px-5 pt-4">
          {learningState}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      {footer ? <div className="shrink-0 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">{footer}</div> : null}
    </div>
  );
});
