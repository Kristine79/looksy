import { describe, expect, it } from "vitest";
import {
  MAX_UPLOAD_IMAGE_SIZE,
  MAX_UPLOAD_IMAGE_SIZE_MB,
  MAX_VISION_PAYLOAD_BASE64,
  planEncodeAttempts,
} from "@/lib/image";

describe("image payload budgets", () => {
  it("allows originals up to 10 MB", () => {
    expect(MAX_UPLOAD_IMAGE_SIZE).toBe(10 * 1024 * 1024);
    expect(MAX_UPLOAD_IMAGE_SIZE_MB).toBe(10);
  });

  it("caps the vision payload below 650K base64 characters (~475KB binary)", () => {
    expect(MAX_VISION_PAYLOAD_BASE64).toBe(650_000);
    expect(MAX_VISION_PAYLOAD_BASE64 / 1024).toBeLessThan(640);
  });
});

describe("planEncodeAttempts", () => {
  it("tries the preferred size/quality first, then progressively smaller and lower", () => {
    const attempts = planEncodeAttempts(1000, 0.75);
    expect(attempts[0]).toEqual({ maxSize: 1000, quality: 0.75 });
    expect(attempts).toHaveLength(9);
    expect(attempts.at(-1)).toEqual({ maxSize: 640, quality: 0.4 });
    for (let i = 1; i < attempts.length; i++) {
      const prev = attempts[i - 1]!;
      const curr = attempts[i]!;
      const sizeGrew = curr.maxSize > prev.maxSize;
      const sameSizeWithHigherQuality = curr.maxSize === prev.maxSize && curr.quality > prev.quality;
      expect(sizeGrew || sameSizeWithHigherQuality).toBe(false);
    }
  });

  it("never shrinks below a usable size and never crops", () => {
    for (const attempt of planEncodeAttempts(1000, 0.75)) {
      expect(attempt.maxSize).toBeGreaterThanOrEqual(640);
      expect(attempt.quality).toBeGreaterThanOrEqual(0.4);
    }
  });
});
