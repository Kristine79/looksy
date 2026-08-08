"use client";

/**
 * Dashboard error boundary — keeps server-render failures (auth, DB) away
 * from the default Next.js error screen and never exposes technical details.
 */
export default function DashboardError({
  error: _error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-error/10 text-2xl">
        🛠️
      </span>
      <h2 className="text-base font-semibold text-neutral-800">
        Something went wrong on this page
      </h2>
      <p className="max-w-sm text-sm text-neutral-500">
        This usually means a temporary connection problem. Try again — your
        wardrobe and looks are safe.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-800"
      >
        Try again
      </button>
    </div>
  );
}
