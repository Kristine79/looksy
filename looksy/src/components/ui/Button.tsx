import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md";
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-ink hover:bg-accent-interactive active:bg-accent-strong disabled:opacity-45",
  secondary:
    "bg-surface text-ink border border-line-strong hover:border-accent-soft-line hover:bg-surface-muted active:bg-surface-muted disabled:opacity-45",
  ghost:
    "bg-transparent text-muted hover:bg-surface-muted hover:text-ink active:text-ink disabled:opacity-45",
  danger:
    "bg-surface text-error-ink border border-error-line hover:bg-error-soft disabled:opacity-45",
};

const sizeClasses = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-[8px] font-medium transition-colors duration-150 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Spinner className="h-4 w-4 shrink-0" /> : null}
      {children}
    </button>
  );
}