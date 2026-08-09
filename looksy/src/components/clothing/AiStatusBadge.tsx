"use client";

import { useTranslation } from "@/i18n/locale-provider";
import { CheckCircleIcon } from "@/components/ui/icons";

export type AiStatus = "pending" | "processing" | "completed" | "needs_review" | "failed";

const STATUS_LABEL_KEY: Record<AiStatus, string> = {
  pending: "ai.pending",
  processing: "ai.processing",
  completed: "ai.completed",
  needs_review: "ai.needsReview",
  failed: "ai.failed",
};

export interface AiStatusBadgeProps {
  status: AiStatus;
  confidence?: number | null;
  model?: string | null;
}

/**
 * Quiet status cue for wardrobe items. Only an active AI process gets a
 * visible indicator; completed items show a small verified mark that never
 * claims attention, and everything else stays silent.
 */
export function AiStatusBadge({ status, confidence, model }: AiStatusBadgeProps) {
  const { t } = useTranslation();
  const labelKey = STATUS_LABEL_KEY[status] ?? "ai.pending";
  const label =
    status === "completed" && confidence != null
      ? t("ai.completedWithConfidence", { pct: Math.round(confidence * 100) })
      : t(labelKey);

  if (status === "pending" || status === "failed") {
    return null;
  }

  if (status === "processing") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface/90 px-2 py-0.5 text-[10px] font-medium text-muted shadow-sm backdrop-blur-sm">
        <span
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent"
          aria-hidden="true"
        />
        {label}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-surface/90 px-2 py-0.5 text-[10px] font-medium text-muted shadow-sm backdrop-blur-sm"
      title={model ?? undefined}
    >
      <CheckCircleIcon className="h-3 w-3 text-success-ink" />
      <span className="sr-only">{label}</span>
    </span>
  );
}