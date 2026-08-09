"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { translate, DEFAULT_LOCALE, type Locale } from ".";

export type { Locale };

export interface LocaleContextValue {
  locale: Locale;
  /** Dotted dictionary key, e.g. "today.title". Falls back to the key itself when missing. */
  t: (key: string, vars?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => Promise<void>;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

const fallback: LocaleContextValue = {
  locale: DEFAULT_LOCALE,
  t: (key, vars) => translate(DEFAULT_LOCALE, key, vars),
  setLocale: async () => {},
};

export function LocaleProvider({
  locale: initial,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initial);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback(
    async (next: Locale) => {
      if (next === locale) return;
      const { setLocaleAction } = await import("./actions");
      setLocaleState(next);
      try {
        await setLocaleAction(next);
      } finally {
        router.refresh();
      }
    },
    [locale, router]
  );

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      t: (key, vars) => translate(locale, key, vars),
      setLocale,
    }),
    [locale, setLocale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** Translation hook. Falls back to English when no provider is mounted (e.g. tests). */
export function useTranslation(): LocaleContextValue {
  return useContext(LocaleContext) ?? fallback;
}