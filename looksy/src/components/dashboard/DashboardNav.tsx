"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/i18n/locale-provider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LocaleSwitcher } from "@/components/theme/LocaleSwitcher";

const LINKS = [
  { href: "/dashboard/recommendations", key: "nav.todaysLook" },
  { href: "/dashboard/wardrobe", key: "nav.wardrobe" },
] as const;

/**
 * Premium, minimal header: brand wordmark, primary nav with an accent underline
 * for the active page, and quiet language + theme controls.
 */
export function DashboardNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-page/90 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-5xl flex-col px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-3">
          <Link
            href="/dashboard/recommendations"
            className="flex items-center gap-2.5"
            aria-label={t("nav.brand")}
          >
            <span
              className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-accent text-accent-ink"
              aria-hidden="true"
            >
              <span className="font-serif text-sm font-semibold tracking-tight">L</span>
            </span>
            <span className="text-sm font-semibold tracking-[0.22em] text-ink">
              {t("nav.brand")}
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <span className="hidden h-5 w-px bg-line sm:block" aria-hidden="true" />
            <ThemeToggle />
          </div>
        </div>

        <nav className="-mb-px flex items-center gap-0 sm:gap-1" aria-label={t("nav.navLabel")}>
          {LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-10 items-center px-3 sm:px-4 text-sm transition-colors ${
                  active
                    ? "font-medium text-accent-soft-ink"
                    : "text-muted hover:text-ink"
                }`}
              >
                {t(link.key)}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent transition-opacity ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                />
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}