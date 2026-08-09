import { db } from "@/lib/db/client";
import { getCurrentUserId } from "@/modules/auth/server";
import { UsersRepository, UsersService } from "@/modules/users";
import { ClosetRepository } from "@/modules/closet";
import { isDemoIdentity } from "@/modules/demo";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { DemoModeBanner } from "@/components/onboarding/DemoModeBanner";
import { OnboardingBanner } from "@/components/onboarding/OnboardingBanner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getCurrentUserId();
  const profile = await new UsersService(new UsersRepository(db))
    .getUserProfile(userId)
    .catch(() => null);

  const showOnboarding = profile?.preferences?.quizCompleted !== true;
  const hasItems = showOnboarding
    ? (await new ClosetRepository(db).findItems(userId, { status: "active", limit: 1 }))
        .length > 0
    : false;
  const demoUser = await isDemoIdentity(userId);

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <DashboardNav />
      {demoUser ? <DemoModeBanner /> : null}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {showOnboarding ? <OnboardingBanner hasItems={hasItems} /> : null}
        {showOnboarding ? <div className="h-8" aria-hidden="true" /> : null}
        {children}
      </main>
    </div>
  );
}