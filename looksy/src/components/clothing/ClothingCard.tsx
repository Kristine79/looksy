"use client";

import type { WardrobeItemWithPhotos } from "@/modules/closet";
import { resolvePhotoUrl } from "@/modules/storage";
import { retryItemFormAction, archiveItemFormAction } from "@/modules/closet/actions";
import { AiStatusBadge } from "./AiStatusBadge";
import type { AiStatus } from "./AiStatusBadge";
import { useTranslation } from "@/i18n/locale-provider";
import { localCategory, localColorName } from "@/i18n/presentation";
import { ExpandIcon, ShirtIcon, TrashIcon } from "@/components/ui/icons";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export interface ClothingCardProps {
  item: WardrobeItemWithPhotos;
  onOpenDetails?: (item: WardrobeItemWithPhotos) => void;
}

/**
 * Wardrobe catalog card. Image-first and calm: the photo carries the card,
 * metadata stays in small, quiet type. The card opens item details — a quiet
 * full-card button that keeps the archive action independent.
 */
export function ClothingCard({ item, onOpenDetails }: ClothingCardProps) {
  const { t } = useTranslation();
  const primaryPhoto = item.photos.find((p) => p.isPrimary) ?? item.photos[0];
  const imageUrl = primaryPhoto ? resolvePhotoUrl(primaryPhoto) : null;
  const analyzing = item.aiStatus === "pending" || item.aiStatus === "processing";
  const aiStatus = item.aiStatus as AiStatus;
  const label = analyzing ? t("clothing.analyzingLabel") : capitalize(item.type);
  const categoryLabel = analyzing ? label : localCategory(t, item.type);

  return (
    <article className="group relative overflow-hidden rounded-xl border border-line bg-surface transition-colors hover:border-line-strong focus-within:border-line-strong">
      <button
        type="button"
        onClick={() => onOpenDetails?.(item)}
        aria-haspopup="dialog"
        aria-label={t("clothing.openDetails", { label })}
        className="absolute inset-0 z-10 cursor-pointer rounded-xl"
      />

      <div className="relative aspect-[4/5] overflow-hidden bg-surface-muted">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={t("clothing.altPhoto", { label })}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-faint">
            <ShirtIcon className="h-7 w-7" />
            <span className="text-[11px]">{t("clothing.noPhotoLabel")}</span>
          </div>
        )}

        <div className="absolute left-2 top-2">
          <AiStatusBadge status={aiStatus} confidence={item.aiConfidence} model={item.aiModelVersion} />
        </div>

        <span
          aria-hidden="true"
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-surface/90 text-muted opacity-0 shadow-sm backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
        >
          <ExpandIcon className="h-3.5 w-3.5" />
        </span>

        {item.aiStatus === "failed" ? (
          <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-center bg-gradient-to-t from-black/50 to-transparent p-3">
            <span className="sr-only">{t("ai.failed")}</span>
            <form action={retryItemFormAction.bind(null, item.id)}>
              <button
                type="submit"
                className="rounded-lg bg-surface px-3 py-1.5 text-xs font-medium text-ink shadow-sm transition-colors hover:bg-surface-muted"
              >
                {t("clothing.reanalyze")}
              </button>
            </form>
          </div>
        ) : null}
      </div>

      <div className="space-y-1.5 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-medium text-ink">
            {analyzing ? t("clothing.analyzingLabel") : categoryLabel}
          </p>
          {!analyzing && item.brand ? (
            <span className="shrink-0 text-[11px] text-muted">{item.brand}</span>
          ) : null}
        </div>
        {!analyzing && item.subType ? (
          <p className="truncate text-xs text-muted">{capitalize(item.subType)}</p>
        ) : null}

        <div className="flex items-center justify-between pt-1">
          {item.colors.length > 0 ? (
            <div
              className="flex items-center gap-1"
              aria-label={item.colors.map((c) => localColorName(t, c.name)).join(", ")}
            >
              {item.colors.slice(0, 4).map((color) => (
                <span
                  key={`${color.name}-${color.hex}`}
                  title={localColorName(t, color.name)}
                  className="h-3 w-3 rounded-full border border-line"
                  style={{ backgroundColor: color.hex }}
                />
              ))}
              {item.colors.length > 4 ? (
                <span className="text-[10px] text-faint">+{item.colors.length - 4}</span>
              ) : null}
            </div>
          ) : (
            <span className="text-[11px] text-faint">{t("clothing.noColors")}</span>
          )}

          <form action={archiveItemFormAction.bind(null, item.id)} className="relative z-20">
            <button
              type="submit"
              title={t("clothing.archive")}
              aria-label={t("clothing.archive")}
              className="rounded-md p-1 text-faint transition-colors hover:bg-error-soft hover:text-error-ink"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}
