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
import { TodayLookExperience } from "@/components/recommendations/TodayLookExperience";
import { MemoryCard } from "@/components/memory/MemoryCard";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = {
  title: "Today's Look — LOOKSY",
  description: "Personal style intelligence that explains every choice",
};

export const dynamic = "force-dynamic";

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
    <div className="space-y-10">
      <TodayLookExperience
        initialLook={initialLook}
        wardrobeCount={wardrobe.length}
        swapCandidates={swapCandidates}
      />

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold tracking-tight text-neutral-900">
            What LOOKSY has learned about you
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Fashion Memory — verified patterns from your wardrobe, wear history and feedback.
          </p>
        </div>

        {memories.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {memories.map((memory) => (
              <MemoryCard key={memory.id} memory={memory} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No memories yet"
            description="Give feedback on looks and add items — LOOKSY will start learning your style."
          />
        )}
      </section>

      <section className="rounded-2xl border border-primary-100 bg-primary-50 p-5">
        <h2 className="text-sm font-semibold text-primary-900">How LOOKSY works</h2>
        <ol className="mt-3 grid gap-4 text-sm text-neutral-700 sm:grid-cols-3">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-700 text-xs font-bold text-white">
              1
            </span>
            <span>
              <strong className="font-semibold">Add items</strong> — LOOKSY analyzes every piece
              with computer vision.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-700 text-xs font-bold text-white">
              2
            </span>
            <span>
              <strong className="font-semibold">Get looks</strong> — recommendations are grounded
              in your wardrobe, palette and history.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-700 text-xs font-bold text-white">
              3
            </span>
            <span>
              <strong className="font-semibold">Teach LOOKSY</strong> — every reaction refines
              your Fashion Memory.
            </span>
          </li>
        </ol>
      </section>
    </div>
  );
}
