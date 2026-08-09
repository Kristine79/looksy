"use client";

import { useTheme } from "./ThemeProvider";
import { useTranslation } from "@/i18n/locale-provider";
import { MoonIcon, SunIcon, MonitorIcon } from "@/components/ui/icons";

/**
 * Compact theme control that cycles Light → Dark → System.
 * Each state is a distinct icon with an accessible label and tooltip.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { mode, setMode } = useTheme();
  const { t } = useTranslation();

  const order = ["light", "dark", "system"] as const;
  const next = order[(order.indexOf(mode) + 1) % order.length] ?? "light";

  const icons = {
    light: SunIcon,
    dark: MoonIcon,
    system: MonitorIcon,
  } as const;
  const Icon = icons[mode];

  const labels = {
    light: t("theme.cycleToLight"),
    dark: t("theme.cycleToDark"),
    system: t("theme.cycleToSystem"),
  } as const;

  return (
    <button
      type="button"
      onClick={() => setMode(next)}
      title={labels[mode]}
      aria-label={labels[mode]}
      aria-pressed={mode === "dark"}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-muted hover:text-ink ${className}`}
    >
      <Icon className="h-4.5 w-4.5" />
    </button>
  );
}