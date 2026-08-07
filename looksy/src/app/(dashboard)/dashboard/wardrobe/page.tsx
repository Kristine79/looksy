import type { Metadata } from "next";
import { getCurrentUserId } from "@/modules/auth/server";
import { getWardrobeForPage } from "@/modules/closet/server";
import { ClothingCard } from "@/components/clothing/ClothingCard";
import { AddClothingForm } from "@/components/clothing/AddClothingForm";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = {
  title: "Wardrobe — LOOKSY",
  description: "Your digital wardrobe — every item LOOKSY understands",
};

export const dynamic = "force-dynamic";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default async function WardrobePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string }>;
}) {
  const userId = await getCurrentUserId();
  const params = await searchParams;

  const items = await getWardrobeForPage(userId, {
    type: params.type,
    status: params.status,
  });

  const categories = Array.from(new Set(items.map((item) => item.type)))
    .filter((type) => type !== "unknown")
    .sort();
  const analyzingCount = items.filter(
    (item) => item.aiStatus === "pending" || item.aiStatus === "processing"
  ).length;
  const verifiedCount = items.filter((item) => item.aiStatus === "completed").length;
  const failedCount = items.filter((item) => item.aiStatus === "failed").length;

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Wardrobe</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Everything LOOKSY knows about what you own.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-white px-3 py-1 border border-neutral-200 text-neutral-600">
              {items.length} items
            </span>
            <span className="rounded-full bg-success/10 px-3 py-1 border border-success/30 text-success">
              {verifiedCount} AI verified
            </span>
            {analyzingCount > 0 ? (
              <span className="rounded-full bg-info/10 px-3 py-1 border border-info/30 text-info">
                {analyzingCount} analyzing
              </span>
            ) : null}
            {failedCount > 0 ? (
              <span className="rounded-full bg-error/10 px-3 py-1 border border-error/30 text-error">
                {failedCount} need attention
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <section className="lg:w-96">
        <AddClothingForm />
      </section>

      {items.length > 0 ? (
        <section>
          {categories.length > 0 ? (
            <div className="mb-4 flex flex-wrap gap-2">
              <a
                href="/dashboard/wardrobe"
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  !params.type
                    ? "bg-primary-700 text-white"
                    : "bg-white border border-neutral-200 text-neutral-600 hover:border-primary-300"
                }`}
              >
                All
              </a>
              {categories.map((category) => (
                <a
                  key={category}
                  href={`/dashboard/wardrobe?type=${category}`}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    params.type === category
                      ? "bg-primary-700 text-white"
                      : "bg-white border border-neutral-200 text-neutral-600 hover:border-primary-300"
                  }`}
                >
                  {capitalize(category)}
                </a>
              ))}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <ClothingCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : (
        <EmptyState
          title="Your wardrobe is empty"
          description="Add your first item and LOOKSY will analyze it — then start building looks that fit your style."
        />
      )}
    </div>
  );
}
