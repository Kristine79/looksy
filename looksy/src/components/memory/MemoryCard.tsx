import type { FashionMemoryRow } from "@/modules/recommendations";
import { Badge } from "@/components/ui/Badge";
import type { BadgeTone } from "@/components/ui/Badge";

const STATUS_META: Record<string, { label: string; tone: BadgeTone }> = {
  confirmed: { label: "Confirmed", tone: "success" },
  possible: { label: "Possible", tone: "primary" },
  emerging: { label: "Emerging", tone: "info" },
  fading: { label: "Fading", tone: "warning" },
  dormant: { label: "Dormant", tone: "neutral" },
};

const FALLBACK_META: { label: string; tone: BadgeTone } = {
  label: "Possible",
  tone: "primary",
};

export interface MemoryCardProps {
  memory: FashionMemoryRow;
}

/**
 * A fashion memory — what LOOKSY has learned about this user.
 * Confidence bar + signal count make the learning visible and trustworthy.
 */
export function MemoryCard({ memory }: MemoryCardProps) {
  const meta = STATUS_META[memory.status] ?? FALLBACK_META;
  const confidence = Math.max(0, Math.min(1, memory.confidence));

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-neutral-900">{memory.description}</h4>
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </div>

      <div className="mt-3 space-y-2">
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100"
          role="presentation"
        >
          <div
            className="h-full rounded-full bg-primary-500 transition-all"
            style={{ width: `${Math.round(confidence * 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-neutral-400">
          <span>confidence {Math.round(confidence * 100)}%</span>
          <span>{memory.dataPoints} signals</span>
        </div>
      </div>
    </article>
  );
}
