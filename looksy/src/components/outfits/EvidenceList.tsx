"use client";

import { useTranslation } from "@/i18n/locale-provider";
import type { ReactNode } from "react";
import type { EvidenceItem } from "@/modules/outfits";
import { localCategory } from "@/i18n/presentation";
import { SparkleIcon, HeartIcon, ShirtIcon, TagIcon, CheckIcon } from "@/components/ui/icons";

export type ReasonIcon = "sparkle" | "heart" | "shirt" | "tag" | "check";

const REASON_ICON: Record<ReasonIcon, ReactNode> = {
  sparkle: <SparkleIcon className="h-3.5 w-3.5" />,
  heart: <HeartIcon className="h-3.5 w-3.5" />,
  shirt: <ShirtIcon className="h-3.5 w-3.5" />,
  tag: <TagIcon className="h-3.5 w-3.5" />,
  check: <CheckIcon className="h-3.5 w-3.5" />,
};

const KEY_ICON: Record<string, ReasonIcon> = {
  palette: "sparkle",
  styleKeywords: "sparkle",
  formality: "tag",
  mostWorn: "shirt",
  savedOutfits: "heart",
  averageRating: "tag",
  feedbackActions: "tag",
  learnedMemory: "tag",
};

/** Classify a legacy reason string into a small icon for scannability. */
export function evidenceIcon(text: string): ReasonIcon {
  const lower = text.toLowerCase();
  if (/palette|color/i.test(lower)) return "sparkle";
  if (/learned|memory|preference|feedback|rating|formality|keyword/i.test(lower)) return "tag";
  if (/saved|save|favourite|favorite/i.test(lower)) return "heart";
  if (/worn|wore|rotation|wear/i.test(lower)) return "shirt";
  if (/weather|°c|temperature/i.test(lower)) return "tag";
  return "check";
}

interface MostWornItem {
  type: string;
  subType?: string | null;
  wearCount: number;
}

interface FormalityEntry {
  occasion: string;
  level: string;
}

interface ActionCount {
  action: string;
  count: number;
}

interface Translate {
  (key: string, vars?: Record<string, string | number>): string;
}

/** Normalize a raw entry from params.entries into a FormalityEntry or null. */
function asFormalityEntry(raw: unknown): FormalityEntry | null {
  // Support tuple: [occasion, level]
  if (Array.isArray(raw) && raw.length >= 2) {
    const [occasion, level] = raw;
    if (typeof occasion === "string") {
      return { occasion, level: String(level) };
    }
    return null;
  }
  // Support object: { occasion: string, level: string }
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.occasion === "string") {
      return { occasion: obj.occasion, level: String(obj.level ?? "") };
    }
  }
  return null;
}

function renderEvidenceText(t: Translate, item: EvidenceItem): string {
  const params = item.params ?? {};
  switch (item.key) {
    case "palette": {
      const colors = Array.isArray(params.colors) ? params.colors.map(String) : [];
      return t("evidence.palette", { colors: colors.join(", ") });
    }
    case "styleKeywords": {
      const words = Array.isArray(params.words) ? params.words.map(String) : [];
      return t("evidence.styleKeywords", { words: words.join(", ") });
    }
    case "formality": {
      const rawEntries = Array.isArray(params.entries) ? params.entries : [];
      const entries = rawEntries
        .map(asFormalityEntry)
        .filter((entry): entry is FormalityEntry => entry !== null);
      const rendered = entries
        .map((entry) => {
          const occasionKey = `occasions.${entry.occasion.toLowerCase()}`;
          const occasionLabel = t(occasionKey);
          const label =
            occasionLabel !== occasionKey ? occasionLabel : entry.occasion;
          return `${label}=${entry.level}`;
        })
        .join(", ");
      return t("evidence.formality", { entries: rendered });
    }
    case "mostWorn": {
      const items = Array.isArray(params.items) ? (params.items as MostWornItem[]) : [];
      const rendered = items
        .map((entry) => {
          const category = localCategory(t, entry.type);
          const subType = entry.subType
            ? ` (${entry.subType.charAt(0).toUpperCase() + entry.subType.slice(1)})`
            : "";
          return `${category}${subType} — ${entry.wearCount}×`;
        })
        .join(", ");
      return t("evidence.mostWorn", { items: rendered });
    }
    case "savedOutfits": {
      return t("evidence.savedOutfits", { count: String(params.count ?? 0) });
    }
    case "averageRating": {
      return t("evidence.averageRating", {
        rating: String(params.rating ?? 0),
        count: String(params.count ?? 0),
      });
    }
    case "feedbackActions": {
      const actions = Array.isArray(params.actions) ? (params.actions as ActionCount[]) : [];
      const rendered = actions
        .map(({ action, count }) => {
          const actionKey = `feedbackActions.${action}`;
          const actionLabel = t(actionKey);
          return `${actionLabel !== actionKey ? actionLabel : action} ×${count}`;
        })
        .join(", ");
      return t("evidence.feedbackActions", { actions: rendered });
    }
    case "learnedMemory": {
      const items = Array.isArray(params.items) ? params.items.map(String) : [];
      return t("evidence.learnedMemory", { items: items.join("; ") });
    }
    default:
      return item.text;
  }
}

export interface EvidenceListProps {
  items: EvidenceItem[];
}

/**
 * "Why this works" — the readable layer of the trust model. Shows the most
 * useful reasoning signals as an editorial list; never debug output.
 * Structured evidence (key + params) is localized at render time; legacy
 * persisted items fall back to their stored text.
 */
export function EvidenceList({ items }: EvidenceListProps) {
  const { t } = useTranslation();

  return (
    <section aria-label={t("outfit.whyTitle")}>
      <h3 className="overline text-muted">{t("outfit.whyTitle")}</h3>
      <ul className="mt-3 divide-y divide-line border-y border-line">
        {items.map((item, index) => {
          const icon = item.key ? (KEY_ICON[item.key] ?? "check") : evidenceIcon(item.text);
          const text = item.key ? renderEvidenceText(t, item) : item.text;
          return (
            <li key={`${item.text}-${index}`} className="flex items-start gap-3 py-3">
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
