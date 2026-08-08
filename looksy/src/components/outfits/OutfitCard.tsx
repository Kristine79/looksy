import { resolvePhotoUrl } from "@/modules/storage";
import type { TodayLookResult } from "@/modules/recommendations/server";
import { EvidenceBadge } from "./EvidenceBadge";
import { FeedbackButtons } from "./FeedbackButtons";

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
 * Today's Look card: items, explanation and the Trust Layer.
 * "Why LOOKSY chose this" is always backed by evidence — never generic AI talk.
 */
export function OutfitCard({ look, swapCandidates = [], onRecorded, onRegenerate }: OutfitCardProps) {
  const confidence = look.recommendation.confidence;
  const hasPhotos = look.items.some((entry) => entry.photos.length > 0);

  return (
    <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary-600">
            Today&apos;s Look
          </p>
          <h2 className="truncate text-lg font-semibold text-neutral-900">{look.name}</h2>
        </div>
        <div className="text-right">
          {confidence > 0 ? (
            <p className="text-sm font-semibold text-neutral-800">
              {Math.round(confidence * 100)}% confidence
            </p>
          ) : null}
          <p className="text-[11px] text-neutral-400">from your wardrobe</p>
        </div>
      </header>

      <div className="space-y-5 px-5 py-5">
        {hasPhotos ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {look.items.map((entry) => {
              const photo = entry.photos.find((p) => p.thumbnailUrl ?? p.url);
              const imageUrl = photo ? resolvePhotoUrl(photo) : null;
              return (
                <div
                  key={entry.item.id}
                  className="group overflow-hidden rounded-xl border border-neutral-200"
                  title={`${entry.item.type}${entry.item.subType ? ` · ${entry.item.subType}` : ""}`}
                >
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt={`${entry.item.type} in this look`}
                      loading="lazy"
                      decoding="async"
                      className="aspect-[3/4] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[3/4] items-center justify-center bg-neutral-100 text-xl">
                      👕
                    </div>
                  )}
                  <p className="truncate bg-neutral-50 px-1 py-1 text-center text-[10px] font-medium text-neutral-600">
                    {capitalize(entry.item.type)}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {look.items.map((entry) => (
              <li
                key={entry.item.id}
                className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700"
              >
                {capitalize(entry.item.type)}
                {entry.item.subType ? ` · ${entry.item.subType}` : ""}
              </li>
            ))}
          </ul>
        )}

        <div className="rounded-xl bg-primary-50 px-4 py-3">
          <p className="text-sm leading-relaxed text-neutral-800">
            {look.recommendation.explanation.whyChosen}
          </p>
        </div>

        {look.evidence.length > 0 ? (
          <section aria-label="Why LOOKSY chose this">
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
              Why LOOKSY chose this
            </h3>
            <ul className="space-y-1.5">
              {look.evidence.map((evidence, index) => (
                <EvidenceBadge key={`${evidence.text}-${index}`} text={evidence.text} />
              ))}
            </ul>
          </section>
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
