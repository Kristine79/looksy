import type { Metadata } from "next";
import { getCurrentUserId } from "@/modules/auth/server";
import { getWardrobeForPage } from "@/modules/closet/server";
import { WardrobeClient } from "@/components/wardrobe/WardrobeClient";
import { translate } from "@/i18n";
import { getLocale } from "@/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: `${translate(locale, "wardrobe.title")} — LOOKSY`,
    description: translate(locale, "meta.wardrobeDescription"),
  };
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
    <WardrobeClient
      items={items}
      categories={categories}
      activeType={params.type}
      counts={{
        total: items.length,
        analyzed: verifiedCount,
        analyzing: analyzingCount,
        failed: failedCount,
      }}
    />
  );
}