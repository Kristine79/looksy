import { logger } from "@/lib/logger";

export interface StoredImage {
  url: string;
  storagePath: string | null;
}

export interface PhotoLike {
  url: string;
  storagePath: string | null;
}

const LOCAL_URL_PREFIX = "local://items/";

/**
 * Image storage abstraction.
 *
 * - Supabase Storage (configured via NEXT_PUBLIC_SUPABASE_URL +
 *   SUPABASE_SERVICE_ROLE_KEY): uploads the image and returns a public URL.
 * - Fallback (local MVP): stores the data URL in the photo row itself. This
 *   keeps the product fully functional without external storage; swap this
 *   branch for S3/GCS later without touching callers.
 */
export class ImageStorageService {
  private readonly supabaseUrl: string | undefined;
  private readonly serviceKey: string | undefined;
  private readonly bucket: string;

  constructor(
    env: Record<string, string | undefined> = process.env
  ) {
    this.supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    this.serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
    this.bucket = env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "looksy-items";
  }

  async store(dataUrl: string, itemId: string): Promise<StoredImage> {
    if (this.supabaseUrl && this.serviceKey) {
      try {
        return await this.storeInSupabase(dataUrl, itemId);
      } catch (error) {
        logger.warn("supabase_upload_failed_falling_back_to_local", {
          itemId,
          error: error instanceof Error ? error.message : "unknown error",
        });
      }
    }
    return this.storeLocal(dataUrl, itemId);
  }

  private async storeInSupabase(dataUrl: string, itemId: string): Promise<StoredImage> {
    const path = `items/${itemId}-${Date.now()}.jpg`;
    const binary = dataUrlToArrayBuffer(dataUrl);
    const response = await fetch(`${this.supabaseUrl}/storage/v1/object/${this.bucket}/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.serviceKey}`,
        "Content-Type": mimeFromDataUrl(dataUrl),
        "x-upsert": "true",
      },
      body: binary,
    });
    if (!response.ok) {
      throw new Error(`Supabase upload failed with status ${response.status}`);
    }
    return {
      url: `${this.supabaseUrl}/storage/v1/object/public/${this.bucket}/${path}`,
      storagePath: path,
    };
  }

  private storeLocal(dataUrl: string, itemId: string): StoredImage {
    return {
      url: `${LOCAL_URL_PREFIX}${itemId}`,
      storagePath: dataUrl,
    };
  }
}

/**
 * Resolves the displayable URL of a photo. Local MVP photos carry their
 * content as a data URL in storagePath; remote photos use url directly.
 */
export function resolvePhotoUrl(photo: PhotoLike): string {
  if (photo.storagePath?.startsWith("data:")) {
    return photo.storagePath;
  }
  return photo.url;
}

export function isLocalPhoto(photo: PhotoLike): boolean {
  return photo.url.startsWith(LOCAL_URL_PREFIX) || photo.storagePath?.startsWith("data:") === true;
}

function dataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function mimeFromDataUrl(dataUrl: string): string {
  const match = /^data:([a-z0-9-+./]+);/i.exec(dataUrl);
  return match?.[1] ?? "image/jpeg";
}
