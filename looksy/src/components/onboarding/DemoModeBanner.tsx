"use client";

import { useTranslation } from "@/i18n/locale-provider";

/**
 * Demo-mode notice — shown when the active account is the seeded demo user.
 * Presented as a normal product state, never a debug banner.
 */
export function DemoModeBanner() {
  const { t } = useTranslation();

  return (
    <div role="status" className="border-b border-line bg-surface-muted/60">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-2 px-4 py-2 text-xs text-muted sm:px-6">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
        <span>
          <strong className="font-medium text-ink-2">{t("demo.title")}</strong>
          <span className="mx-1.5 text-faint" aria-hidden="true">
            ·
          </span>
          {t("demo.body")}
        </span>
      </div>
    </div>
  );
}