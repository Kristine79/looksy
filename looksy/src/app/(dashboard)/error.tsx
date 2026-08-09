"use client";

import { useTranslation } from "@/i18n/locale-provider";

/**
 * Dashboard error boundary — keeps server-render failures (auth, DB) away
 * from the default Next.js error screen and never exposes technical details.
 */
export default function DashboardError({
  error: _error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-surface px-6 py-16 text-center">
      <h2 className="text-base font-medium text-ink">{t("error.title")}</h2>
      <p className="max-w-sm text-sm leading-relaxed text-muted">{t("error.body")}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 rounded-[8px] bg-accent px-4 py-2 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-interactive"
      >
        {t("error.action")}
      </button>
    </div>
  );
}