import { describe, it, expect, vi, beforeEach } from "vitest";

const { insertEventMock, loggerWarnMock } = vi.hoisted(() => ({
  insertEventMock: vi.fn(),
  loggerWarnMock: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({ db: {} }));

vi.mock("@/modules/analytics/repository", () => ({
  AnalyticsRepository: class {
    insertEvent = insertEventMock;
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { warn: loggerWarnMock },
}));

import { ANALYTICS_EVENTS, emitEvent, trackEvent } from "@/modules/analytics/tracker";

describe("analytics tracker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("tracks an event with userId and properties", async () => {
    insertEventMock.mockResolvedValueOnce([{ id: "event-1" }]);

    await trackEvent("user-1", ANALYTICS_EVENTS.OUTFIT_SAVED, { outfitId: "outfit-1" });

    expect(insertEventMock).toHaveBeenCalledWith("user-1", "outfit_saved", {
      outfitId: "outfit-1",
    });
    expect(loggerWarnMock).not.toHaveBeenCalled();
  });

  it("never throws when the database write fails", async () => {
    insertEventMock.mockRejectedValueOnce(new Error("db down"));

    await expect(trackEvent("user-1", "user_created")).resolves.toBeUndefined();
    expect(loggerWarnMock).toHaveBeenCalledWith(
      "analytics_track_failed",
      expect.objectContaining({ eventName: "user_created" })
    );
  });

  it("emitEvent is fire-and-forget and never rejects", async () => {
    insertEventMock.mockRejectedValueOnce(new Error("db down"));

    expect(() => emitEvent("user-1", ANALYTICS_EVENTS.ITEM_ADDED)).not.toThrow();
    await vi.waitFor(() => {
      expect(loggerWarnMock).toHaveBeenCalled();
    });
  });

  it("works without a userId (anonymous events)", async () => {
    insertEventMock.mockResolvedValueOnce([{ id: "event-2" }]);

    await trackEvent(null, "outfit_generated");

    expect(insertEventMock).toHaveBeenCalledWith(null, "outfit_generated", {});
  });
});
