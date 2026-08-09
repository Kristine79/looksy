"use client";

import { useTranslation } from "@/i18n/locale-provider";
import type { ReactNode } from "react";
import { SparkleIcon, HeartIcon, ShirtIcon, TagIcon, CheckIcon } from "@/components/ui/icons";

export type ReasonIcon = "sparkle" | "heart" | "shirt" | "tag" | "check";

const REASON_ICON: Record<ReasonIcon, ReactNode> = {
  sparkle: <SparkleIcon className="h-3.5 w-3.5" />,
  heart: <HeartIcon className="h-3.5 w-3.5" />,
  shirt: <ShirtIcon className="h-3.5 w-3.5" />,
  tag: <TagIcon className="h-3.5 w-3.5" />,
  check: <CheckIcon className="h-3.5 w-3.5" />,
};

/** Classify a reason string into a small icon for scannability. */
export function evidenceIcon(text: string): ReasonIcon {
  const lower = text.toLowerCase();
  if (/palette|color/i.test(lower)) return "sparkle";
  if (/learned|memory|preference|feedback/i.test(lower)) return "tag";
  if (/saved|save|favourite|favorite/i.test(lower)) return "heart";
  if (/worn|wore|rotation|wear/i.test(lower)) return "shirt";
  if (/learned|memory|preference|feedback/i.test(lower)) return "tag";
  if (/weather|°c|temperature/i.test(lower)) return "tag";
  return "check";
}

export interface EvidenceListProps {
  items: string[];
}

/**
 * "Why this works" — the readable layer of the trust model. Shows the most
 * useful reasoning signals as an editorial list; never debug output.
 */
export function EvidenceList({ items }: EvidenceListProps) {
  const { t } = useTranslation();

  return (
    <section aria-label={t("outfit.whyTitle")}>
      <h3 className="overline text-muted">{t("outfit.whyTitle")}</h3>
      <ul className="mt-3 divide-y divide-line border-y border-line">
        {items.map((text, index) => {
          const icon = evidenceIcon(text);
          return (
            <li key={`${text}-${index}`} className="flex items-start gap-3 py-3">
              <span className="mt-0.5 shrink-0 text-accent-soft-ink" aria-hidden="true">
                {REASON_ICON[icon]}
              </span>
              <span className="text-sm leading-relaxed text-ink-2">{text}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}