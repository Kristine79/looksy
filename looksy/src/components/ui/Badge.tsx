export type BadgeTone =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "info";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-surface-muted text-muted border-line",
  primary: "bg-accent-soft text-accent-soft-ink border-accent-soft-line",
  success: "bg-success-soft text-success-ink border-success-line",
  warning: "bg-warning-soft text-warning-ink border-warning-line",
  error: "bg-error-soft text-error-ink border-error-line",
  info: "bg-info-soft text-info-ink border-info-line",
};

export interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export function Badge({ tone = "neutral", children, className = "", title }: BadgeProps) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}