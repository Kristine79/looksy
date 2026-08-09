"use client";

import { useTranslation, type Locale } from "@/i18n/locale-provider";
import { LOCALES, LOCALE_LABELS } from "@/i18n/config";
import { GlobeIcon } from "@/components/ui/icons";

/**
 * Compact language switcher (EN | RU). Rendered as a small segmented control.
 */
export function LocaleSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-md border border-line bg-surface-muted p-0.5 ${className}`}
      role="group"
      aria-label={t("lang.select")}
    >
      <GlobeIcon className="mx-1 h-3.5 w-3.5 text-faint" />
      {LOCALES.map((code) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code as Locale)}
            aria-pressed={active}
            className={`rounded-[4px] px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
              active
                ? "bg-surface text-ink shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            {LOCALE_LABELS[code]}
          </button>
        );
      })}
    </div>
  );
}