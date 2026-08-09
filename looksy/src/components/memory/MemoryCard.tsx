"use client";

import { Badge } from "@/components/ui/Badge";
import { useTranslation } from "@/i18n/locale-provider";
import type { FashionMemoryRow } from "@/modules/recommendations";

export interface MemoryCardProps {
  memory: FashionMemoryRow;
}

const STATUS_TONE: Record<string, "neutral" | "primary" | "success" | "warning" | "info"> = {
  confirmed: "success",
  possible: "primary",
  emerging: "info",
  fading: "warning",
  dormant: "neutral",
};

/**
 * A fashion memory — what LOOKSY has learned about this user.
 * Presented as an editorial element; confidence bar + status act as a
 * subtle progress cue, never an analytics row of numbers.
 */
export function MemoryCard({ memory }: MemoryCardProps) {
  const { t } = useTranslation();
  const tone = STATUS_TONE[memory.status] ?? "neutral";
  const confidence = Math.max(0, Math.min(1, memory.confidence));

  return (
    <article className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-ink">{memory.description}</h4>
        <Badge tone={tone}>{t(`memory.status.${memory.status}`) ?? memory.status}</Badge>
      </div>

      <div className="mt-3 space-y-2">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted" role="presentation">
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${Math.round(confidence * 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted">
          <span>{t("memory.confidence", { pct: Math.round(confidence * 100) })}</span>
          <span>{t("memory.signals", { n: memory.dataPoints })}</span>
        </div>
      </div>
    </article>
  );
}