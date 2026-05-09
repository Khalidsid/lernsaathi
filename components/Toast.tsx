"use client";

/**
 * Slice 3.8: Success Toast Component
 *
 * Displays brief success notifications with animations.
 * Automatically dismisses after a timeout.
 */

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

type ToastProps = {
  message: string;
  variant?: ToastVariant;
  duration?: number; // milliseconds
  onClose?: () => void;
};

export function Toast({ message, variant = "success", duration = 3000, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          onClose?.();
        }, 200); // Match exit animation duration
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const variantStyles = {
    success: "bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200",
    error: "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200",
    info: "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
  };

  const Icon = variant === "success" ? Check : variant === "error" ? X : null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 shadow-lg ${
        variantStyles[variant]
      } ${isExiting ? "animate-fade-out" : "animate-slide-up"}`}
      role="alert"
    >
      {Icon ? (
        <div className="flex-shrink-0">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      ) : null}
      <p className="text-sm font-medium">{message}</p>
      {onClose ? (
        <button
          onClick={() => {
            setIsExiting(true);
            setTimeout(onClose, 200);
          }}
          className="ml-2 flex-shrink-0 rounded p-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label="Close"
          type="button"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  function showToast(message: string, variant: ToastVariant = "success") {
    setToast({ message, variant });
  }

  function hideToast() {
    setToast(null);
  }

  const toastElement = toast ? (
    <Toast message={toast.message} variant={toast.variant} onClose={hideToast} />
  ) : null;

  return { showToast, hideToast, toastElement };
}
