export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

/**
 * Empty / first-run state. Editorial treatment: hairline panel, generous
 * spacing and a single clear invitation to act.
 */
export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-surface px-6 py-16 text-center">
      {icon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent-soft-ink">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-medium text-ink">{title}</h3>
      {description ? (
        <p className="max-w-sm text-sm leading-relaxed text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}