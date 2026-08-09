import type { Metadata } from "next";
import { getCurrentUserId } from "@/modules/auth/server";
import { getWardrobeForPage } from "@/modules/closet/server";
import type { WardrobeItemWithPhotos } from "@/modules/closet";
import {
  getLatestLook,
  getLookDetails,
  getStyleMemories,
} from "@/modules/recommendations/server";
import type { LookItem } from "@/modules/recommendations/server";
import { translate } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { TodayLookExperience } from "@/components/recommendations/TodayLookExperience";
import { MemoryCard } from "@/components/memory/MemoryCard";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: `${translate(locale, "today.title")} — LOOKSY`,
    description: translate(locale, "meta.recommendationsDescription"),
  };
}

function toLookItem(item: WardrobeItemWithPhotos): LookItem {
  return {
    item: { ...item },
    photos: item.photos.map((photo) => ({
      url: photo.url,
      thumbnailUrl: photo.thumbnailUrl,
      storagePath: photo.storagePath,
    })),
  };
}

export default async function RecommendationsPage() {
  const userId = await getCurrentUserId();
  const locale = await getLocale();

  const [latestLook, memories, wardrobe] = await Promise.all([
    getLatestLook(userId),
    getStyleMemories(userId),
    getWardrobeForPage(userId, {}),
  ]);

  const initialLook = latestLook ? await getLookDetails(userId, latestLook.outfitId) : null;

  const swapCandidates = wardrobe
    .filter(
      (item) => !initialLook?.items.some((entry) => entry.item.id === item.id)
    )
    .map(toLookItem);

  return (
    <div className="space-y-12">
      <TodayLookExperience
        initialLook={initialLook}
        wardrobeCount={wardrobe.length}
        swapCandidates={swapCandidates}
      />

      <section aria-labelledby="memory-heading">
        <div className="mb-4">
          <h2 id="memory-heading" className="text-lg font-medium tracking-tight text-ink">
            {translate(locale, "memory.title")}
          </h2>
          <p className="mt-1 text-sm text-muted">{translate(locale, "memory.subtitle")}</p>
        </div>

        {memories.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {memories.map((memory) => (
              <MemoryCard key={memory.id} memory={memory} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={translate(locale, "memory.emptyTitle")}
            description={translate(locale, "memory.emptyDescription")}
          />
        )}
      </section>
    </div>
  );
}