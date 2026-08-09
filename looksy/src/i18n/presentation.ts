import type { FashionMemoryRow } from "@/modules/recommendations";

/** t() signature shared by the client provider and server translate. */
export type TranslateFn = (
  key: string,
  vars?: Record<string, string | number>
) => string;

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Centralized category presentation: maps a stored item type (an English enum
 * produced by the vision pipeline) to the active locale. Falls back to the
 * capitalized raw value when the dictionary has no entry.
 */
export function localCategory(t: TranslateFn, type: string): string {
  const key = `categories.${type.toLowerCase()}`;
  const label = t(key);
  return label !== key ? label : capitalize(type);
}

/**
 * Centralized color presentation: maps a stored color name (English, produced
 * by the vision pipeline) to the active locale. Falls back to the raw name.
 */
export function localColorName(t: TranslateFn, name: string): string {
  const key = `colorNames.${name.trim().toLowerCase()}`;
  const label = t(key);
  return label !== key ? label : name;
}

const MEMORY_PATTERN_KEYS: Record<string, string> = {
  color_preference: "memoryPatterns.color",
  style_tendency: "memoryPatterns.tendency",
  negative_preference: "memoryPatterns.negative",
  context_preference: "memoryPatterns.context",
};

/**
 * Localized presentation for a Fashion Memory, derived from its structured
 * `type` + `category` (e.g. `color_preference` + `color:white`). The database
 * `description` stays untouched (it feeds the LLM prompts in English) and is
 * only used as a fallback for patterns the dictionary does not cover.
 */
export function memoryLabel(
  t: TranslateFn,
  memory: Pick<FashionMemoryRow, "type" | "category" | "description">
): string {
  const patternKey = MEMORY_PATTERN_KEYS[memory.type];
  if (patternKey) {
    const slug = (memory.category.split(":")[1] ?? memory.category)
      .trim()
      .toLowerCase();
    const thingKey = `memoryThings.${slug}`;
    const thing = t(thingKey);
    if (thing !== thingKey) {
      return t(patternKey, { thing });
    }
  }
  return memory.description;
}

/**
 * Localized outfit title. Persisted names derived from an occasion or the
 * hardcoded fallback are mapped through the dictionary; genuine AI names are
 * returned as-is (they are generated in the user's locale by the pipeline).
 */
export function localizedLookTitle(
  t: TranslateFn,
  look: { name: string; occasion: string | null }
): string {
  const name = look.name;
  const nameLower = name.toLowerCase();
  if (look.occasion) {
    const occasionKey = `occasions.${look.occasion.toLowerCase()}`;
    const occasionLabel = t(occasionKey);
    if (occasionLabel !== occasionKey && nameLower === look.occasion.toLowerCase()) {
      return occasionLabel;
    }
  }
  if (nameLower === "today's look" || nameLower === "образ дня") {
    return t("recommendation.todayName");
  }
  return name;
}
