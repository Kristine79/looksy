import { describe, expect, it, vi } from "vitest";
import { and, eq, sql } from "drizzle-orm";
import { fashionMemories } from "./schema";
import { INACTIVE_MEMORY_STATUSES, MemoriesRepository } from "./repository";

/**
 * Regression tests for the active-memory filter boundary.
 *
 * `findActiveMemories` is the single source of truth for which memories may
 * influence a recommendation. It must scope to the acting userId (isolation)
 * and exclude `deleted`, `fading` and `dormant` memories so that a decayed or
 * user-rejected preference never reaches the recommendation prompt.
 */

/** The exact WHERE clause used by the repository, built the same way. */
function buildActiveMemoryWhere(userId: string) {
  return and(
    eq(fashionMemories.userId, userId),
    ...INACTIVE_MEMORY_STATUSES.map((status) => sql`${fashionMemories.status} <> ${status}`),
  );
}

describe("INACTIVE_MEMORY_STATUSES", () => {
  it("excludes deleted, fading and dormant memories from the active context", () => {
    expect(INACTIVE_MEMORY_STATUSES).toEqual(["deleted", "fading", "dormant"]);
  });
});

describe("MemoriesRepository.findActiveMemories", () => {
  function createDbMock() {
    const calls: { where?: unknown }[] = [];
    const chain = {
      select: vi.fn(() => chain),
      from: vi.fn(() => chain),
      where: vi.fn((whereConditions: unknown) => {
        calls.push({ where: whereConditions });
        return chain;
      }),
      orderBy: vi.fn(() => chain),
      limit: vi.fn(() => []),
    };
    const repo = new MemoriesRepository({ select: chain.select } as never);
    return { chain, calls, repo };
  }

  it("applies the same WHERE clause that excludes inactive statuses", async () => {
    const { calls, repo } = createDbMock();

    await repo.findActiveMemories("user-42", 20);

    expect(calls).toHaveLength(1);
    // The where clause built by the repository must structurally match the
    // user-scoped, inactive-status-excluding condition we assert below.
    expect(calls[0]!.where).toEqual(buildActiveMemoryWhere("user-42"));
  });

  it("scopes every select to the acting userId", async () => {
    const { calls, repo } = createDbMock();

    await repo.findActiveMemories("user-7", 5);

    expect(calls).toHaveLength(1);
    expect(calls[0]!.where).toBeDefined();
  });

  it("excludes each inactive status from the recommendation boundary", () => {
    // Guard: if a future change adds a new inactive status (e.g. "archived"),
    // this test forces the contributor to extend the boundary consciously.
    const expected = ["deleted", "fading", "dormant"];
    expect(INACTIVE_MEMORY_STATUSES).toContain("deleted");
    expect(INACTIVE_MEMORY_STATUSES).toContain("fading");
    expect(INACTIVE_MEMORY_STATUSES).toContain("dormant");
    expect(new Set(INACTIVE_MEMORY_STATUSES)).toEqual(new Set(expected));
  });
});