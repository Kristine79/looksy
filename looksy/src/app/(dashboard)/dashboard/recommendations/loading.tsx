import { Skeleton } from "@/components/ui/Skeleton";

export default function RecommendationsLoading() {
  return (
    <div className="space-y-12">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="space-y-4">
        <div className="rounded-2xl border border-line bg-surface p-6 sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="aspect-[3/4]" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-5 h-12 w-full" />
          <Skeleton className="mt-5 h-24 w-full" />
        </div>
      </div>
    </div>
  );
}