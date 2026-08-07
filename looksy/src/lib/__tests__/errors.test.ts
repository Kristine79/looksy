import { describe, it, expect } from "vitest";
import {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  handleApiError,
} from "../errors";

describe("AppError", () => {
  it("creates an error with default values", () => {
    const error = new AppError("test error", "TEST_CODE");
    expect(error.message).toBe("test error");
    expect(error.code).toBe("TEST_CODE");
    expect(error.statusCode).toBe(500);
  });

  it("creates an error with custom status code", () => {
    const error = new AppError("test", "CODE", 400);
    expect(error.statusCode).toBe(400);
  });
});

describe("NotFoundError", () => {
  it("creates not found error", () => {
    const error = new NotFoundError("User", "123");
    expect(error.message).toContain("User not found");
    expect(error.statusCode).toBe(404);
  });
});

describe("ValidationError", () => {
  it("creates validation error with details", () => {
    const error = new ValidationError("Invalid input", { field: "email" });
    expect(error.statusCode).toBe(400);
    expect(error.details).toEqual({ field: "email" });
  });
});

describe("UnauthorizedError", () => {
  it("creates unauthorized error", () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
  });
});

describe("ForbiddenError", () => {
  it("creates forbidden error", () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
  });
});

describe("handleApiError", () => {
  it("handles AppError", () => {
    const error = new NotFoundError("Item");
    const response = handleApiError(error);
    expect(response.status).toBe(404);
  });

  it("handles unknown errors", () => {
    const response = handleApiError(new Error("unexpected"));
    expect(response.status).toBe(500);
  });
});
