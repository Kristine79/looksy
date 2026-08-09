/**
 * Maximum size of the ORIGINAL uploaded file. Client-side UX check; the
 * server never sees the original (it is downscaled client-side), so the
 * vision payload cap below is the server-side enforcement point.
 */
export const MAX_UPLOAD_IMAGE_SIZE = 10 * 1024 * 1024;
export const MAX_UPLOAD_IMAGE_SIZE_MB = 10;

/**
 * Vision payload budget: the final data URL handed to the vision model must
 * stay within this many characters (base64). ~650K chars ≈ 475KB binary —
 * comfortably under the 500KB target while retaining enough detail.
 */
export const MAX_VISION_PAYLOAD_BASE64 = 650_000;

export interface ImageReadResult {
  dataUrl: string;
  width: number;
  height: number;
}

/** Error raised by `readImageFile`; `code` lets the UI localize the message. */
export class ImageFileError extends Error {
  constructor(
    message: string,
    readonly code: "too-large" | "not-an-image" | "unreadable" | "invalid-image"
  ) {
    super(message);
    this.name = "ImageFileError";
  }
}

export interface EncodeAttempt {
  maxSize: number;
  quality: number;
}

/**
 * Downscale/re-encode ladder: first attempt at the preferred size and
 * quality, then progressively smaller/lower until the vision payload budget
 * is met. Never crops, never corrupts the source data URL.
 */
export function planEncodeAttempts(
  maxSize: number,
  quality: number
): EncodeAttempt[] {
  const sizes = [maxSize, Math.round(maxSize * 0.8), Math.round(maxSize * 0.64)];
  const qualities = [quality, 0.6, 0.4];
  const attempts: EncodeAttempt[] = [];
  for (const s of sizes) {
    for (const q of qualities) {
      attempts.push({ maxSize: s, quality: q });
    }
  }
  return attempts;
}

/**
 * Reads an image file, downscales it to fit within `maxSize`, re-encodes it
 * as a JPEG data URL and compresses iteratively until it fits the vision
 * payload budget. The original file is never modified.
 */
export function readImageFile(
  file: File,
  options: { maxSize?: number; quality?: number } = {}
): Promise<ImageReadResult> {
  const maxSize = options.maxSize ?? 1000;
  const quality = options.quality ?? 0.75;

  if (!file.type.startsWith("image/")) {
    return Promise.reject(new ImageFileError("Please choose an image file", "not-an-image"));
  }
  if (file.size > MAX_UPLOAD_IMAGE_SIZE) {
    return Promise.reject(
      new ImageFileError(
        `Image is too large — max ${MAX_UPLOAD_IMAGE_SIZE_MB}MB`,
        "too-large"
      )
    );
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new ImageFileError("Could not read the image file", "unreadable"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () =>
        reject(new ImageFileError("The selected file is not a valid image", "invalid-image"));
      image.onload = () => {
        const encode = (attempt: EncodeAttempt): { dataUrl: string; width: number; height: number } => {
          const scale = Math.min(1, attempt.maxSize / Math.max(image.width, image.height));
          const width = Math.max(1, Math.round(image.width * scale));
          const height = Math.max(1, Math.round(image.height * scale));

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d");
          if (!context) {
            throw new ImageFileError("Canvas is not supported in this browser", "unreadable");
          }
          context.drawImage(image, 0, 0, width, height);
          return {
            dataUrl: canvas.toDataURL("image/jpeg", attempt.quality),
            width,
            height,
          };
        };

        try {
          let last: { dataUrl: string; width: number; height: number } | null = null;
          for (const attempt of planEncodeAttempts(maxSize, quality)) {
            last = encode(attempt);
            if (last.dataUrl.length <= MAX_VISION_PAYLOAD_BASE64) {
              resolve(last);
              return;
            }
          }
          resolve(last!);
        } catch (error) {
          reject(
            error instanceof ImageFileError
              ? error
              : new ImageFileError("Could not process the image file", "unreadable")
          );
        }
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
