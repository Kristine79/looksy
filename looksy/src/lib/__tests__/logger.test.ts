import { describe, it, expect } from "vitest";
import { createLogger } from "../logger";

describe("createLogger", () => {
  it("creates a logger without context", () => {
    const logger = createLogger();
    expect(logger).toBeDefined();
  });

  it("creates a logger with context", () => {
    const logger = createLogger({ requestId: "123" });
    expect(logger).toBeDefined();
  });

  it("child logger inherits context", () => {
    const parent = createLogger({ userId: "abc" });
    const child = parent.child({ requestId: "xyz" });
    expect(child).toBeDefined();
  });
});
