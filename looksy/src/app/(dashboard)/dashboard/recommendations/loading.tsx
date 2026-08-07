import { Skeleton } from "@/components/ui/Skeleton";

export default function RecommendationsLoading() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-9 w-56" />
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="aspect-[3/4]" />
            ))}
          </div>
          <Skeleton className="mt-4 h-16 w-full" />
          <div className="mt-4 space-y-2">
            <Skeleton className="h-3 w-40" />
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
