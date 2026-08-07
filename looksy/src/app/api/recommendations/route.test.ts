import { describe, it, expect, vi, beforeEach } from "vitest";
import { UnauthorizedError } from "@/lib/errors";

const { getCurrentUserIdMock, getTodayLookMock } = vi.hoisted(() => ({
  getCurrentUserIdMock: vi.fn().mockResolvedValue("user-1"),
  getTodayLookMock: vi.fn(),
}));

vi.mock("@/modules/auth/server", () => ({
  getCurrentUserId: getCurrentUserIdMock,
}));

vi.mock("@/modules/recommendations/server", async () => {
  const actual = await vi.importActual<typeof import("@/modules/recommendations/server")>(
    "@/modules/recommendations/server"
  );
  return {
    todayLookInputSchema: actual.todayLookInputSchema,
    getTodayLook: getTodayLookMock,
  };
});

import { POST } from "@/app/api/recommendations/route";

describe("POST /api/recommendations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the generated look", async () => {
    getTodayLookMock.mockResolvedValue({ outfitId: "outfit-1", name: "Work" });

    const response = await POST(
      new Request("http://localhost/api/recommendations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ occasion: "casual" }),
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ outfitId: "outfit-1", name: "Work" });
    expect(getTodayLookMock).toHaveBeenCalledWith("user-1", { occasion: "casual" });
  });

  it("returns 400 for an invalid body", async () => {
    const response = await POST(
      new Request("http://localhost/api/recommendations", {
        method: "POST",
        body: JSON.stringify({ occasion: "bogus" }),
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(getTodayLookMock).not.toHaveBeenCalled();
  });

  it("returns 401 when no user can be resolved", async () => {
    getCurrentUserIdMock.mockRejectedValue(new UnauthorizedError());

    const response = await POST(
      new Request("http://localhost/api/recommendations", {
        method: "POST",
        body: JSON.stringify({}),
      })
    );

    expect(response.status).toBe(401);
  });
});
