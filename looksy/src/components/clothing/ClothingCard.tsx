import type { WardrobeItemWithPhotos } from "@/modules/closet";
import { resolvePhotoUrl } from "@/modules/storage";
import { retryItemFormAction, archiveItemFormAction } from "@/modules/closet/actions";
import { AiStatusBadge } from "./AiStatusBadge";
import type { AiStatus } from "./AiStatusBadge";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export interface ClothingCardProps {
  item: WardrobeItemWithPhotos;
}

/**
 * Wardrobe item card. Shows the photo, AI-extracted metadata and the AI status.
 * Failed items expose a "Re-analyze" action; the card is a server component —
 * retry/archive run as progressive-enhancement server actions.
 */
export function ClothingCard({ item }: ClothingCardProps) {
  const primaryPhoto = item.photos.find((p) => p.isPrimary) ?? item.photos[0];
  const imageUrl = primaryPhoto ? resolvePhotoUrl(primaryPhoto) : null;
  const analyzing = item.aiStatus === "pending" || item.aiStatus === "processing";
  const aiStatus = item.aiStatus as AiStatus;
  const label = analyzing ? "Analyzing item" : capitalize(item.type);

  return (
    <article className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={`${label} photo`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-4xl">👕</span>
          </div>
        )}

        <div className="absolute left-2 top-2">
          <AiStatusBadge status={aiStatus} confidence={item.aiConfidence} model={item.aiModelVersion} />
        </div>

        {item.aiStatus === "failed" ? (
          <div className="absolute inset-0 flex items-end justify-center bg-neutral-900/40 p-3">
            <form action={retryItemFormAction.bind(null, item.id)}>
              <button
                type="submit"
                className="w-full rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow hover:bg-neutral-100"
              >
                Re-analyze item
              </button>
            </form>
          </div>
        ) : null}
      </div>

      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-neutral-900">
              {analyzing ? "Analyzing item…" : label}
            </p>
            {!analyzing && item.subType ? (
              <p className="truncate text-xs text-neutral-500">{capitalize(item.subType)}</p>
            ) : null}
          </div>
          {!analyzing && item.brand ? (
            <span className="shrink-0 text-xs text-neutral-400">{item.brand}</span>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-2">
          {item.colors.length > 0 ? (
            <div className="flex items-center gap-1" aria-label="Colors">
              {item.colors.slice(0, 4).map((color) => (
                <span
                  key={`${color.name}-${color.hex}`}
                  title={color.name}
                  className="h-3 w-3 rounded-full border border-neutral-200"
                  style={{ backgroundColor: color.hex }}
                />
              ))}
              {item.colors.length > 4 ? (
                <span className="text-[10px] text-neutral-400">+{item.colors.length - 4}</span>
              ) : null}
            </div>
          ) : (
            <span className="text-[11px] text-neutral-300">colors pending AI analysis</span>
          )}

          <form action={archiveItemFormAction.bind(null, item.id)}>
            <button
              type="submit"
              title="Remove from wardrobe"
              className="rounded-md p-1 text-neutral-300 transition-colors hover:bg-error/10 hover:text-error"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}
