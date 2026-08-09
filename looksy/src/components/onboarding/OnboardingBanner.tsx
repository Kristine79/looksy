"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeOnboardingAction } from "@/modules/users/actions";
import { loadDemoWardrobeAction } from "@/modules/demo/actions";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useTranslation } from "@/i18n/locale-provider";
import { CameraIcon, SparkleIcon, ShirtIcon } from "@/components/ui/icons";

export interface OnboardingBannerProps {
  hasItems: boolean;
}

/**
 * First-time welcome state — introduces LOOKSY within a minute and offers a
 * one-click sample wardrobe. Editorial and calm, not a feature dump.
 */
export function OnboardingBanner({ hasItems }: OnboardingBannerProps) {
  const router = useRouter();
  const { t } = useTranslation();
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
      setError(t("onboarding.errDemo"));
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

  const steps = [
    { Icon: CameraIcon, title: t("onboarding.step1Title"), text: t("onboarding.step1Text") },
    { Icon: SparkleIcon, title: t("onboarding.step2Title"), text: t("onboarding.step2Text") },
    { Icon: ShirtIcon, title: t("onboarding.step3Title"), text: t("onboarding.step3Text") },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex flex-col gap-6 p-6 sm:p-8">
        <div className="space-y-1.5">
          <p className="overline overline-rule text-accent-text">{t("onboarding.welcome")}</p>
          <h2 className="text-xl font-medium tracking-tight text-ink">
            {t("onboarding.title")}
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-muted">{t("onboarding.body")}</p>
        </div>

        <ol className="grid gap-3 sm:grid-cols-3">
          {steps.map((step) => (
            <li
              key={step.title}
              className="rounded-xl border border-line bg-surface-muted/50 p-4"
            >
              <step.Icon className="h-5 w-5 text-accent-soft-ink" />
              <p className="mt-2.5 text-sm font-medium text-ink">{step.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{step.text}</p>
            </li>
          ))}
        </ol>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {!hasItems && !demoLoaded ? (
            <Button type="button" onClick={handleLoadDemo} loading={loadingDemo}>
              {loadingDemo ? t("onboarding.loadingDemo") : t("onboarding.loadDemo")}
            </Button>
          ) : null}
          {demoLoaded ? (
            <p className="text-sm font-medium text-success-ink" role="status">
              {t("onboarding.demoLoaded")}
            </p>
          ) : null}
          <Button type="button" variant="secondary" onClick={handleStart}>
            {hasItems || demoLoaded ? t("onboarding.gotIt") : t("onboarding.startScratch")}
          </Button>
          {loadingDemo ? <Spinner className="h-4 w-4 text-accent" /> : null}
        </div>

        {error ? (
          <p className="text-xs font-medium text-error-ink" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}