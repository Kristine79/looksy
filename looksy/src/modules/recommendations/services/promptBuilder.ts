import type {
  RecommendationContext,
  RecommendationPrompt,
  StructuredEvidence,
} from "./types";
import type { ClothingItemRow } from "@/modules/closet/types";
import type { UserStyleContext } from "@/modules/recommendations/types";
import type { Locale } from "@/i18n";

const OUTPUT_JSON_DESCRIPTION = `{
  "outfit": [ { "itemId": "<exact itemId from the wardrobe>", "reason": "<short why this item>" } ],
  "explanation": {
    "whyChosen": "<why this exact combination of items>",
    "styleMatch": "<how it matches the user's verified preferences>",
    "contextMatch": "<how it fits the occasion/weather/request>"
  },
  "confidence": 0.0
}`;

const LANGUAGE_NAMES: Record<Locale, string> = {
  en: "English",
  ru: "Russian",
};

/**
 * Prompt Builder — the only place where prompts are assembled.
 * Services never inline prompt strings.
 *
 * Trust Layer contract: every reason must be grounded either in
 * (a) the verified evidence facts derived from user data, or
 * (b) the attributes of items the user already owns.
 */
export class PromptBuilder {
  build(context: RecommendationContext): RecommendationPrompt {
    return {
      systemPrompt: this.buildSystemPrompt(context),
      userPrompt: this.buildUserPrompt(context),
    };
  }

  buildSystemPrompt(context: RecommendationContext): string {
    const evidence = formatEvidenceForPrompt(this.buildEvidence(context));

    return [
      "You are LOOKSY, a personal style intelligence engine.",
      "You build outfits exclusively from the user's own wardrobe and explain why each choice fits THIS user.",
      "",
      "Rules:",
      "- Reference items ONLY by their exact itemId from the wardrobe list.",
      "- Never suggest buying, renting, or generic fashion advice.",
      "- Ground every reason in the verified evidence below or in the listed item attributes.",
      "- Do not invent preferences the evidence does not support.",
      "- Return ONLY a valid JSON object — no markdown, no commentary.",
      "",
      "Verified evidence about this user (use it to justify your choices):",
      ...(evidence.length > 0
        ? evidence
        : ["- Not enough user data yet — rely on the item attributes only."]),
      "",
      `Respond with JSON exactly matching this shape: ${OUTPUT_JSON_DESCRIPTION}`,
    ].join("\n");
  }

  buildUserPrompt(context: RecommendationContext): string {
    const { style } = context;

    const sections: string[] = [
      `User request: "${context.query}"`,
      `Occasion: ${context.occasion ?? "not specified"}`,
      `Weather: ${formatWeather(context.weather)}`,
      "",
      "Your wardrobe (candidates):",
      ...context.candidates.map(formatItem),
    ];

    if (style.styleProfile) {
      sections.push("", "Style profile:", ...formatStyleProfile(style));
    }

    if (style.memories.length > 0) {
      sections.push(
        "",
        "Learned preferences (memories):",
        ...style.memories
          .slice(0, 10)
          .map((m) => `- [${m.status}] ${m.type.replaceAll("_", " ")}: ${m.description}`)
      );
    }

    if (style.recentOutfits.length > 0) {
      sections.push(
        "",
        "Recently created outfits:",
        ...style.recentOutfits
          .slice(0, 8)
          .map((o) => `- ${o.name ?? "outfit"} [${o.status}] on ${formatDate(o.createdAt)}`)
      );
    }

    sections.push(
      "",
      "Pick 2-6 items that best answer the user request.",
      "Every itemId MUST exist in the wardrobe list above.",
      `Write all user-facing text (explanations, reasons, outfit name) in ${LANGUAGE_NAMES[context.locale]}.`,
      "Return the JSON object now."
    );

    return sections.join("\n");
  }

  /** Explanation prompt for an already-selected set of items (AIProvider.generateExplanation). */
  buildExplanationPrompt(
    context: RecommendationContext,
    itemIds: string[]
  ): RecommendationPrompt {
    const selected = context.candidates.filter((item) => itemIds.includes(item.id));
    const missing = itemIds.filter((id) => !context.candidates.some((item) => item.id === id));

    const systemPrompt = [
      "You are LOOKSY, a personal style intelligence engine.",
      "Explain why a specific set of items works for THIS user.",
      "Ground every statement in the verified evidence and item attributes provided.",
      "Never suggest buying or generic fashion advice.",
      `Write all user-facing text (explanations, reasons) in ${LANGUAGE_NAMES[context.locale]}.`,
      "Return ONLY a valid JSON object — no markdown, no commentary.",
      "",
      "Respond with JSON exactly matching this shape:",
      `{ "explanation": { "whyChosen": "", "styleMatch": "", "contextMatch": "" } }`,
    ].join("\n");

    const userPrompt = [
      `User request: "${context.query}"`,
      `Occasion: ${context.occasion ?? "not specified"}`,
      `Weather: ${formatWeather(context.weather)}`,
      "",
      "Selected items:",
      ...selected.map(formatItem),
      ...(missing.length > 0 ? [`(not in the provided wardrobe: ${missing.join(", ")})`] : []),
      "",
      "Verified evidence:",
      ...(formatEvidenceForPrompt(this.buildEvidence(context)).length > 0
        ? formatEvidenceForPrompt(this.buildEvidence(context))
        : ["- not enough user data yet — rely on the item attributes only."]),
      "",
      "Explain why these items fit the request, this user's style, and the context.",
    ].join("\n");

    return { systemPrompt, userPrompt };
  }

  /**
   * Trust Layer: derives checkable facts from user data.
   * Only statements that are provable from the data end up here —
   * the LLM is instructed to justify choices with these facts.
   *
   * Returns structured evidence: the localized presentation is derived from
   * `key` + `params` at render time; `en` is the canonical English rendering
   * used for LLM prompts and persisted history.
   */
  buildEvidence(context: RecommendationContext): StructuredEvidence[] {
    const { style } = context;
    const evidence: StructuredEvidence[] = [];

    const dna = style.styleProfile?.dna;
    if (dna?.colors && dna.colors.length > 0) {
      const colors = dna.colors
        .slice()
        .sort((a, b) => (b.share ?? 0) - (a.share ?? 0))
        .slice(0, 5)
        .map((c) => c.name);
      evidence.push({
        key: "palette",
        params: { colors },
        en: `Preferred color palette: ${colors.join(", ")}`,
      });
    }
    if (dna?.styleWords && dna.styleWords.length > 0) {
      const words = dna.styleWords.slice(0, 8);
      evidence.push({
        key: "styleKeywords",
        params: { words },
        en: `Style keywords: ${words.join(", ")}`,
      });
    }
    if (dna?.formalityByOccasion) {
      const entries = Object.entries(dna.formalityByOccasion);
      if (entries.length > 0) {
        const top = entries
          .slice(0, 4)
          .map(([occasion, level]) => ({ occasion, level: `${level}/5` }));
        evidence.push({
          key: "formality",
          params: { entries: top },
          en: `Formality per occasion: ${top.map((entry) => `${entry.occasion}=${entry.level}`).join(", ")}`,
        });
      }
    }

    const worn = style.wardrobe
      .filter((item) => item.wearCount > 0)
      .sort((a, b) => b.wearCount - a.wearCount)
      .slice(0, 3);
    if (worn.length > 0) {
      const items = worn.map((item) => ({
        type: item.type,
        subType: item.subType ?? null,
        wearCount: item.wearCount,
      }));
      evidence.push({
        key: "mostWorn",
        params: { items },
        en: `Most worn items: ${items
          .map((i) => `${i.type}${i.subType ? ` (${i.subType})` : ""} — worn ${i.wearCount}x`)
          .join(", ")}`,
      });
    }

    const savedCount = style.recentOutfits.filter((o) => o.status === "saved").length;
    if (savedCount > 0) {
      evidence.push({
        key: "savedOutfits",
        params: { count: savedCount },
        en: `Based on your saved outfits: ${savedCount} saved`,
      });
    }

    const rated = style.feedback.filter((f) => f.rating != null);
    if (rated.length > 0) {
      const avg = rated.reduce((sum, f) => sum + (f.rating ?? 0), 0) / rated.length;
      evidence.push({
        key: "averageRating",
        params: { rating: avg.toFixed(1), count: rated.length },
        en: `Average outfit rating: ${avg.toFixed(1)}/4 from ${rated.length} ratings`,
      });
    }

    const actionCounts = style.feedback.reduce<Record<string, number>>((acc, f) => {
      acc[f.action] = (acc[f.action] ?? 0) + 1;
      return acc;
    }, {});
    const actions = Object.entries(actionCounts).map(([action, count]) => ({ action, count }));
    if (actions.length > 0) {
      evidence.push({
        key: "feedbackActions",
        params: { actions },
        en: `Your feedback actions: ${actions.map(({ action, count }) => `${action} ×${count}`).join(", ")}`,
      });
    }

    const memories = style.memories.filter(
      (m) => m.status === "confirmed" || m.status === "possible"
    );
    if (memories.length > 0) {
      const items = memories.slice(0, 5).map((m) => m.description);
      evidence.push({
        key: "learnedMemory",
        params: { items },
        en: `Learned from your history: ${items.join("; ")}`,
      });
    }

    return evidence;
  }
}

/** Canonical English rendering of evidence facts — always used for LLM prompts. */
export function formatEvidenceForPrompt(evidence: StructuredEvidence[]): string[] {
  return evidence.map((entry) => entry.en);
}

function formatItem(item: ClothingItemRow): string {
  const colors = item.colors.map((c) => c.name).join(",");
  const seasons = item.seasons.join(",");
  const lastWorn = item.lastWorn ? formatDate(item.lastWorn) : "never";
  return [
    `- itemId=${item.id}`,
    `type=${item.type}`,
    `subType=${item.subType ?? "-"}`,
    `brand=${item.brand ?? "-"}`,
    `colors=${colors || "-"}`,
    `seasons=${seasons || "-"}`,
    `formality=${item.formality}/5`,
    `material=${item.material ?? "-"}`,
    `pattern=${item.pattern ?? "-"}`,
    `worn=${item.wearCount}x (last ${lastWorn})`,
  ].join(" ");
}

function formatStyleProfile(style: UserStyleContext): string[] {
  const dna = style.styleProfile?.dna;
  const lines: string[] = [];
  if (dna?.primaryDirection) lines.push(`- primary direction: ${dna.primaryDirection}`);
  if (dna?.silhouette) lines.push(`- silhouette: ${dna.silhouette}`);
  if (dna?.fabrics && dna.fabrics.length > 0) lines.push(`- fabrics: ${dna.fabrics.join(", ")}`);
  if (dna?.paletteTemperature) lines.push(`- palette temperature: ${dna.paletteTemperature}`);
  if (style.styleProfile?.itemsAnalyzed != null) {
    lines.push(`- based on ${style.styleProfile.itemsAnalyzed} analyzed items`);
  }
  if (lines.length === 0) lines.push("- (no style profile data yet)");
  return lines;
}

function formatWeather(weather: RecommendationContext["weather"]): string {
  if (!weather) return "not specified";
  const parts: string[] = [];
  if (weather.tempC != null) parts.push(`${weather.tempC}°C`);
  if (weather.condition) parts.push(weather.condition);
  if (weather.humidity != null) parts.push(`humidity ${weather.humidity}%`);
  if (weather.windKph != null) parts.push(`wind ${weather.windKph} km/h`);
  return parts.length > 0 ? parts.join(", ") : "not specified";
}

function formatDate(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 10);
}
