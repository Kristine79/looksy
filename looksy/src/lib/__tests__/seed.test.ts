import { describe, expect, it } from "vitest";
import { buildMemorySeedRows } from "@/lib/db/seed";
import { MemoryAutomationService } from "@/modules/recommendations/automationService";
import type { MemoriesRepository } from "@/modules/recommendations/repository";

// aggregateEvidence is pure — the repository is never touched by the builder.
const automation = new MemoryAutomationService({} as MemoriesRepository);
const NOW = new Date("2026-08-08T12:00:00Z");
const DAY_MS = 24 * 60 * 60 * 1000;

const rows = buildMemorySeedRows(automation, NOW);
const byCategory = new Map(rows.map((r) => [r.memory.category, r]));
const allEvidence = rows.flatMap((r) => r.evidence);

describe("buildMemorySeedRows", () => {
  it("produces 4 demo memories spanning the confidence spectrum", () => {
    expect(rows).toHaveLength(4);
    expect(rows.map((r) => r.memory.status).sort()).toEqual([
      "confirmed",
      "emerging",
      "fading",
      "possible",
    ]);
  });

  it("never writes evidence above the model's max weight (0.6) — regression lock", () => {
    const weights = allEvidence.map((e) => e.confidence ?? 0);
    expect(Math.max(...weights)).toBeLessThanOrEqual(0.6);
    expect(allEvidence.some((e) => e.confidence === 0.9)).toBe(false);
  });

  it("keeps every evidence confidence on the SIGNAL_WEIGHTS scale", () => {
    const allowed = new Set([0.4, 0.5, 0.6]);
    for (const e of allEvidence) {
      expect(allowed.has(e.confidence ?? -1)).toBe(true);
    }
  });

  it("structured_fit: 3 fresh max-weight evidence → 0.6 / possible", () => {
    const row = byCategory.get("structured_fit")!;
    expect(row.memory.type).toBe("style_tendency");
    expect(row.memory.confidence).toBe(0.6);
    expect(row.memory.status).toBe("possible");
    expect(row.memory.dataPoints).toBe(3);
    expect(row.memory.consistency).toBe(1);
    expect(row.evidence).toHaveLength(3);
    expect(row.evidence.every((e) => e.confidence === 0.6)).toBe(true);
  });

  it("monday_work: mixed evidence → 0.45 / emerging", () => {
    const row = byCategory.get("monday_work")!;
    expect(row.memory.confidence).toBe(0.45);
    expect(row.memory.status).toBe("emerging");
    expect(row.memory.dataPoints).toBe(2);
  });

  it("bold_prints: contradiction subtracts → 0.231 / fading, consistency 0.75", () => {
    const row = byCategory.get("bold_prints")!;
    expect(row.memory.type).toBe("negative_preference");
    expect(row.memory.confidence).toBeCloseTo(0.231, 3);
    expect(row.memory.status).toBe("fading");
    expect(row.memory.dataPoints).toBe(4);
    expect(row.memory.consistency).toBe(0.75);
    const contradictions = row.evidence.filter((e) => e.data?.contradiction === true);
    expect(contradictions).toHaveLength(1);
    expect(contradictions[0]!.confidence).toBe(0.5);
  });

  it("earth_tones: user-confirmed → 0.8 / confirmed with pin markers", () => {
    const row = byCategory.get("earth_tones")!;
    expect(row.memory.confidence).toBe(0.8);
    expect(row.memory.status).toBe("confirmed");
    expect(row.memory.userConfirmedAt).toEqual(NOW);
    expect(row.memory.lastConfirmed).toEqual(NOW);
    expect(row.evidence).toHaveLength(4);
  });

  it("spreads evidence ages across the freshness bands", () => {
    const ages = byCategory
      .get("earth_tones")!
      .evidence.map((e) => Math.round((NOW.getTime() - e.createdAt.getTime()) / DAY_MS));
    expect(ages).toEqual([8, 35, 120, 220]);
    const fresh = byCategory.get("structured_fit")!.evidence;
    expect(fresh.every((e) => (NOW.getTime() - e.createdAt.getTime()) / DAY_MS <= 30)).toBe(true);
  });

  it("only contradiction evidence carries the contradiction data flag", () => {
    const flagged = allEvidence.filter((e) => e.data?.contradiction === true);
    expect(flagged).toHaveLength(1);
    expect(flagged[0]!.type).toBe("worn_frequency");
  });
});
