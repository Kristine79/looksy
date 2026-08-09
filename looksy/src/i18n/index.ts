import { en, type Messages } from "./messages/en";
import { ru } from "./messages/ru";
import { type Locale } from "./config";

export type { Messages } from "./messages/en";
export type { Locale } from "./config";
export { LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_LABELS, normalizeLocale } from "./config";

const dictionaries: Record<Locale, Messages> = { en, ru };

export function getDictionary(locale: Locale): Messages {
  return dictionaries[locale] ?? en;
}

/** Russian plural forms: [one, few, many]. */
export function pluralRu(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (last === 1) return forms[0];
  if (last >= 2 && last <= 4) return forms[1];
  return forms[2];
}

const deepGet = (obj: unknown, path: string): unknown =>
  path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);

/**
 * Resolves a dotted key inside the dictionary and interpolates `{name}` tokens.
 * Falls back to the English dictionary when a key is missing so a translation
 * gap can never break the UI.
 */
export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>
): string {
  let template =
    (deepGet(getDictionary(locale), key) as string | undefined) ??
    (deepGet(en, key) as string | undefined) ??
    key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      template = template.replaceAll(`{${name}}`, String(value));
    }
  }
  return template;
}