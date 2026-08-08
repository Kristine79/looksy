/**
 * Demo-mode notice — shown when the active account is the seeded demo user.
 * Clearly marks sample data so a demo never looks like real user progress.
 */
export function DemoModeBanner() {
  return (
    <div
      role="status"
      className="border-b border-primary-100 bg-primary-50/80"
    >
      <div className="mx-auto flex w-full max-w-5xl items-center gap-2 px-4 py-2 text-xs text-primary-800">
        <span aria-hidden="true">🛍️</span>
        <span>
          Demo mode — you are browsing a sample wardrobe. Add your own photos
          anytime or run <code className="rounded bg-white/70 px-1 font-mono text-[11px]">npm run db:seed</code>{" "}
          to refresh it.
        </span>
      </div>
    </div>
  );
}
