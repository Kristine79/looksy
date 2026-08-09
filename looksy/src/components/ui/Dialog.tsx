"use client";

import { useEffect, useId, useRef } from "react";
import { useTranslation } from "@/i18n/locale-provider";
import { XIcon } from "@/components/ui/icons";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  /** sheet — bottom sheet on mobile, right drawer on desktop; centered — modal */
  variant?: "sheet" | "centered";
}

function isFocusable(el: HTMLElement): boolean {
  if (el.hasAttribute("disabled") || el.closest("[hidden]") !== null) {
    return false;
  }
  const tag = el.tagName;
  return (
    tag === "BUTTON" ||
    tag === "A" ||
    tag === "SELECT" ||
    tag === "TEXTAREA" ||
    tag === "INPUT" ||
    (el.hasAttribute("tabindex") && Number(el.getAttribute("tabindex")) >= 0)
  );
}

/**
 * Accessible dialog shell: overlay, focus trap, Escape to close, click-outside
 * close and body scroll lock. Focus returns to the trigger on unmount.
 * Layout variants: "sheet" (touch-friendly bottom sheet on mobile, right
 * drawer on desktop) and "centered" (modal).
 */
export function Dialog({
  open,
  onClose,
  title,
  eyebrow,
  children,
  variant = "centered",
}: DialogProps) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement | null;

    const panel = panelRef.current;
    if (panel) {
      const first = Array.from(panel.querySelectorAll<HTMLElement>("*")).find(isFocusable);
      (first ?? panel).focus();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus.current?.focus();
    };
  }, [open]);

  if (!open) {
    return null;
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab") {
      return;
    }
    const panel = panelRef.current;
    if (!panel) return;
    const focusables = Array.from(panel.querySelectorAll<HTMLElement>("*")).filter(isFocusable);
    if (focusables.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;
    const active = document.activeElement as HTMLElement | null;
    if (event.shiftKey) {
      if (active === first || !panel.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else if (active === last || !panel.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  }

  const panelClasses =
    variant === "sheet"
      ? "animate-dialog-panel animate-dialog-sheet fixed inset-x-0 bottom-0 z-[60] flex max-h-[85dvh] flex-col overflow-hidden rounded-t-2xl border border-b-0 border-line bg-surface shadow-lg md:inset-x-auto md:inset-y-0 md:right-0 md:max-h-none md:w-full md:max-w-md md:rounded-l-2xl md:rounded-tr-none md:border-b"
      : "animate-dialog-panel fixed inset-0 z-[60] m-auto flex max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-lg";

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="animate-dialog-overlay absolute inset-0 bg-overlay"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={panelClasses}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0 pr-8">
            {eyebrow ? (
              <p className="overline text-accent-text">{eyebrow}</p>
            ) : null}
            <h2
              id={titleId}
              className="mt-0.5 truncate text-lg font-medium tracking-tight text-ink"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="-mr-1 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-faint transition-colors hover:bg-surface-muted hover:text-ink"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </header>
        {/* min-h-0 + flex-1: only the content scrolls inside the dialog;
            the header stays pinned and the panel never grows past max-h */}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
