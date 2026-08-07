import { Badge } from "@/components/ui/Badge";
import type { BadgeTone } from "@/components/ui/Badge";

export type AiStatus = "pending" | "processing" | "completed" | "needs_review" | "failed";

const STATUS_META: Record<AiStatus, { label: string; tone: BadgeTone; pulse: boolean }> = {
  pending: { label: "Analyzing soon", tone: "info", pulse: false },
  processing: { label: "LOOKSY is analyzing", tone: "info", pulse: true },
  completed: { label: "AI verified", tone: "success", pulse: false },
  needs_review: { label: "Needs review", tone: "warning", pulse: false },
  failed: { label: "Analysis failed", tone: "error", pulse: false },
};

export interface AiStatusBadgeProps {
  status: AiStatus;
  confidence?: number | null;
  model?: string | null;
}

export function AiStatusBadge({ status, confidence, model }: AiStatusBadgeProps) {
  const meta = STATUS_META[status] ?? STATUS_META.pending;
  const label =
    status === "completed" && confidence != null
      ? `${meta.label} · ${Math.round(confidence * 100)}%`
      : meta.label;

  return (
    <Badge tone={meta.tone} title={model ?? undefined}>
      {meta.pulse ? (
        <span
          className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-info"
          aria-hidden="true"
        />
      ) : null}
      {label}
    </Badge>
  );
}
