"use client";

import { resolvePhotoUrl } from "@/modules/storage";
import type { TodayLookResult } from "@/modules/recommendations/server";
import { useTranslation } from "@/i18n/locale-provider";
import { localCategory, localizedLookTitle } from "@/i18n/presentation";
import { EvidenceList } from "./EvidenceList";
import { FeedbackButtons } from "./FeedbackButtons";
import { ImageOffIcon, ShirtIcon } from "@/components/ui/icons";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export interface OutfitCardProps {
  look: TodayLookResult;
  swapCandidates?: TodayLookResult["items"];
  onRecorded?: (action: "love" | "wore" | "change" | "skip") => void;
  onRegenerate?: () => Promise<TodayLookResult>;
}

/**
 * Today's Look centerpiece. The outfit reads as a composed look — image-first
 * garments with light metadata — and the reasoning is presented as a calm
 * editorial "Why this works" narrative, never an analytics report.
 */
export function OutfitCard({
  look,
  swapCandidates = [],
  onRecorded,
  onRegenerate,
}: OutfitCardProps) {
  const { t } = useTranslation();
  const confidence = Math.round((look.recommendation.confidence ?? 0) * 100);
  const hasPhotos = look.items.some((entry) => entry.photos.length > 0);
  const occasionLabel = look.occasion ? t(`occasions.${look.occasion.toLowerCase()}`) : null;
  const title = localizedLookTitle(t, look);

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-surface">
      <header className="border-b border-line px-5 py-5 sm:px-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="overline text-accent-text">
              {occasionLabel ?? t("outfit.occasionFallback")}
            </p>
            <h2 className="mt-1.5 text-xl font-medium tracking-tight text-ink sm:text-2xl">
              {title}
            </h2>
          </div>
          <div className="flex flex-col items-end gap-1">
            {confidence > 0 ? (
              <p className="text-sm font-medium text-ink">{t("outfit.confidence", { pct: confidence })}</p>
            ) : null}
            <p className="text-[11px] text-faint">{t("outfit.fromWardrobe")}</p>
            {confidence > 0 ? (
              <div
                className="mt-1 h-0.5 w-16 overflow-hidden rounded-full bg-surface-muted"
                role="presentation"
              >
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${confidence}%` }}
                />
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="space-y-7 px-5 py-6 sm:px-7 sm:py-7">
        {hasPhotos ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4" role="list">
            {look.items.map((entry) => {
              const photo = entry.photos.find((p) => p.thumbnailUrl ?? p.url);
              const imageUrl = photo ? resolvePhotoUrl(photo) : null;
              const display = localCategory(t, entry.item.type);
              const name = entry.item.subType ? capitalize(entry.item.subType) : display;
              return (
                <li key={entry.item.id}>
                  <figure className="group">
                    <div className="aspect-[3/4] overflow-hidden rounded-xl border border-line bg-surface-muted">
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageUrl}
                          alt={t("outfit.itemAlt", { category: display })}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-faint">
                          <ImageOffIcon className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <figcaption className="mt-2.5 px-0.5">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-faint">
                        {display}
                      </p>
                      <p className="truncate text-sm font-medium text-ink">{name}</p>
                      {entry.item.brand ? (
                        <p className="truncate text-xs text-muted">{entry.item.brand}</p>
                      ) : null}
                    </figcaption>
                  </figure>
                </li>
              );
            })}
          </ul>
        ) : (
          <ul className="flex flex-wrap gap-2" role="list">
            {look.items.map((entry) => {
              const display = localCategory(t, entry.item.type);
              return (
                <li
                  key={entry.item.id}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-muted px-3 py-1.5 text-sm text-ink"
                >
                  <ShirtIcon className="h-3.5 w-3.5 text-faint" />
                  {display}
                  {entry.item.subType ? ` · ${capitalize(entry.item.subType)}` : ""}
                </li>
              );
            })}
          </ul>
        )}

        {look.recommendation.explanation.whyChosen ? (
          <div className="flex gap-3">
            <span
              className="mt-1 h-0.5 w-5 shrink-0 rounded-full bg-accent"
              aria-hidden="true"
            />
            <p className="text-[15px] leading-relaxed text-ink-2">
              {look.recommendation.explanation.whyChosen}
            </p>
          </div>
        ) : null}

        {look.evidence.length > 0 ? (
          <EvidenceList items={look.evidence} />
        ) : null}

        <FeedbackButtons
          look={look}
          swapCandidates={swapCandidates}
          onRecorded={onRecorded}
          onRegenerate={onRegenerate}
        />
      </div>
    </article>
  );
}
