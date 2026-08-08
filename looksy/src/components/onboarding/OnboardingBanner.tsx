"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeOnboardingAction } from "@/modules/users/actions";
import { loadDemoWardrobeAction } from "@/modules/demo/actions";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export interface OnboardingBannerProps {
  hasItems: boolean;
}

const STEPS = [
  {
    emoji: "📸",
    title: "Add your clothes",
    text: "Take a photo of any piece — LOOKSY recognizes type, colors, material and style.",
  },
  {
    emoji: "✨",
    title: "LOOKSY analyzes them",
    text: "Every item gets AI metadata and joins your digital wardrobe.",
  },
  {
    emoji: "🧠",
    title: "Recommendations improve over time",
    text: "The more you wear, save and review looks, the better LOOKSY knows you.",
  },
];

/**
 * First-time welcome state — helps a new user understand LOOKSY within a
 * minute. Offers a one-click demo wardrobe when the account is empty.
 */
export function OnboardingBanner({ hasItems }: OnboardingBannerProps) {
  const router = useRouter();
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (dismissed) {
    return null;
  }

  async function handleLoadDemo() {
    if (loadingDemo) return;
    setLoadingDemo(true);
    setError(null);
    try {
      const result = await loadDemoWardrobeAction();
      if (result.status === "loaded") {
        setDemoLoaded(true);
      }
      router.refresh();
    } catch {
      setError("Couldn't load the demo wardrobe right now. You can try again.");
    } finally {
      setLoadingDemo(false);
    }
  }

  async function handleStart() {
    try {
      await completeOnboardingAction();
    } catch {
      // Onboarding is cosmetic — never block the user on a failed flag write.
    }
    setDismissed(true);
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 to-white">
      <div className="flex flex-col gap-6 p-6 sm:p-8">
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary-600">
            Welcome
          </p>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">
            LOOKSY — Your AI stylist that learns your personal style.
          </h2>
          <p className="max-w-xl text-sm text-neutral-600">
            Build a digital wardrobe from your photos. LOOKSY understands every
            piece and explains why it picks each look — grounded in your real
            clothes, not generic advice.
          </p>
        </div>

        <ol className="grid gap-3 sm:grid-cols-3">
          {STEPS.map((step) => (
            <li
              key={step.title}
              className="rounded-xl border border-primary-100 bg-white/70 p-4"
            >
              <span className="text-xl" aria-hidden="true">
                {step.emoji}
              </span>
              <p className="mt-2 text-sm font-semibold text-neutral-800">{step.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500">{step.text}</p>
            </li>
          ))}
        </ol>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {!hasItems && !demoLoaded ? (
            <Button type="button" onClick={handleLoadDemo} loading={loadingDemo}>
              {loadingDemo ? "Loading sample wardrobe…" : "Explore with a sample wardrobe"}
            </Button>
          ) : null}
          {demoLoaded ? (
            <p className="text-sm font-medium text-success" role="status">
              Sample wardrobe loaded — check Wardrobe and Today&apos;s Look.
            </p>
          ) : null}
          <Button type="button" variant="secondary" onClick={handleStart}>
            {hasItems || demoLoaded ? "Got it" : "Start from scratch"}
          </Button>
          {loadingDemo ? <Spinner className="h-4 w-4 text-primary-600" /> : null}
        </div>

        {error ? (
          <p className="text-xs font-medium text-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
