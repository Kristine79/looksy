import { describe, it, expect, vi, beforeEach } from "vitest";

const { getCurrentUserIdMock, upsertPreferencesMock } = vi.hoisted(() => ({
  getCurrentUserIdMock: vi.fn().mockResolvedValue("user-1"),
  upsertPreferencesMock: vi.fn(),
}));

vi.mock("@/modules/auth/server", () => ({
  getCurrentUserId: getCurrentUserIdMock,
}));

vi.mock("@/lib/db/client", () => ({ db: {} }));

vi.mock("@/modules/users", async () => {
  const actual = await vi.importActual<typeof import("@/modules/users")>("@/modules/users");
  return {
    ...actual,
    UsersRepository: class {
      upsertPreferences = upsertPreferencesMock;
    },
    UsersService: actual.UsersService,
  };
});

import { completeOnboardingAction } from "@/modules/users/actions";

describe("completeOnboardingAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks onboarding as completed for the current user", async () => {
    upsertPreferencesMock.mockResolvedValue([{ userId: "user-1" }]);

    const result = await completeOnboardingAction();

    expect(getCurrentUserIdMock).toHaveBeenCalled();
    expect(upsertPreferencesMock).toHaveBeenCalledWith("user-1", { quizCompleted: true });
    expect(result).toEqual({ ok: true });
  });
});
