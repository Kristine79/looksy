export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export interface ImageReadResult {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Reads an image file, downscales it to fit within `maxSize` and re-encodes
 * it as a JPEG data URL. Keeps payloads small enough for server actions and
 * the local storage fallback.
 */
export function readImageFile(
  file: File,
  options: { maxSize?: number; quality?: number } = {}
): Promise<ImageReadResult> {
  const maxSize = options.maxSize ?? 1000;
  const quality = options.quality ?? 0.85;

  if (!file.type.startsWith("image/")) {
    return Promise.reject(new Error("Please choose an image file"));
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return Promise.reject(new Error("Image is too large — max 4MB"));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the image file"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("The selected file is not a valid image"));
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Canvas is not supported in this browser"));
          return;
        }
        context.drawImage(image, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve({ dataUrl, width, height });
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
