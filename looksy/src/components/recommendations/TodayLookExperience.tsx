"use client";

import { useState } from "react";
import type { LookItem, TodayLookResult } from "@/modules/recommendations/server";
import { getTodayLookAction } from "@/modules/recommendations/actions";
import { OCCASIONS } from "@/lib/occasions";
import type { Occasion } from "@/lib/occasions";
import { OutfitCard } from "@/components/outfits/OutfitCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTranslation } from "@/i18n/locale-provider";
import { ShirtIcon } from "@/components/ui/icons";

export interface TodayLookExperienceProps {
  initialLook: TodayLookResult | null;
  wardrobeCount: number;
  swapCandidates?: LookItem[];
}

function occasionKey(value: string): string {
  return `occasions.${value.toLowerCase()}`;
}

/**
 * The main product screen — generates, displays and refines Today's Look.
 * Server actions remain the only data path; this component only orchestrates
 * loading/error/empty states around them, with a calm, editorial layout.
 */
export function TodayLookExperience({
  initialLook,
  wardrobeCount,
  swapCandidates = [],
}: TodayLookExperienceProps) {
  const { t } = useTranslation();
  const [look, setLook] = useState<TodayLookResult | null>(initialLook);
  const [degraded, setDegraded] = useState<boolean>(initialLook?.degraded ?? false);
  const [notice, setNotice] = useState<string | null>(
    initialLook?.degraded ? (initialLook.message ?? null) : null
  );
  const [occasion, setOccasion] = useState<Occasion | "">("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runGenerate(): Promise<TodayLookResult | null> {
    setGenerating(true);
    setError(null);
    try {
      const result = await getTodayLookAction({ occasion: occasion || null });
      if (result.error || !result.look) {
        setError(result.message ?? t("today.errorGenerate"));
        setNotice(null);
        setDegraded(false);
        return null;
      }
      setLook(result.look);
      setDegraded(result.degraded ?? false);
      setNotice(result.degraded ? (result.message ?? null) : null);
      return result.look;
    } catch {
      setError(t("today.errorGenerate"));
      setNotice(null);
      setDegraded(false);
      return null;
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-10">
      <section>
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="overline overline-rule text-accent-text">{t("today.eyebrow")}</p>
            <h1 className="mt-3 text-2xl font-medium tracking-tight text-ink sm:text-3xl">
              {t("today.title")}
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
              {t("today.builtFrom", { count: wardrobeCount })}
            </p>
          </div>

          <div className="hidden shrink-0 flex-col items-stretch gap-2 sm:flex">
            <label className="sr-only" htmlFor="occasion">
              {t("today.occasionLabel")}
            </label>
            <select
              id="occasion"
              value={occasion}
              onChange={(event) => setOccasion(event.target.value as Occasion)}
              className="h-10 rounded-[8px] border border-line-strong bg-surface px-3 text-sm text-ink focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-interactive"
            >
              <option value="">{t("today.noOccasion")}</option>
              {OCCASIONS.map((value) => (
                <option key={value} value={value}>
                  {t(occasionKey(value))}
                </option>
              ))}
            </select>
            <Button type="button" onClick={runGenerate} loading={generating}>
              {look ? t("today.newLook") : t("today.generateLook")}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 sm:hidden">
          <label className="sr-only" htmlFor="occasion-mobile">
            {t("today.occasionLabel")}
          </label>
          <select
            id="occasion-mobile"
            value={occasion}
            onChange={(event) => setOccasion(event.target.value as Occasion)}
            className="h-10 flex-1 rounded-[8px] border border-line-strong bg-surface px-3 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-interactive"
          >
            <option value="">{t("today.noOccasion")}</option>
            {OCCASIONS.map((value) => (
              <option key={value} value={value}>
                {t(occasionKey(value))}
              </option>
            ))}
          </select>
          <Button type="button" onClick={runGenerate} loading={generating}>
            {look ? t("today.newLook") : t("today.generateLook")}
          </Button>
        </div>
      </section>

      {generating ? (
        <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <Spinner className="h-5 w-5 text-accent" />
            <div>
              <p className="text-sm font-medium text-ink">{t("today.generating")}</p>
              <p className="mt-0.5 max-w-md text-xs leading-relaxed text-muted">
                {t("today.generatingHint")}
              </p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="aspect-[3/4]" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-error-line bg-error-soft/50 p-8 text-center">
          <p className="text-sm font-medium text-error-ink">{error}</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={runGenerate}
          >
            {t("common.tryAgain")}
          </Button>
        </div>
      ) : look && look.items.length > 0 ? (
        <div className="space-y-6">
          {degraded && notice ? (
            <div
              role="status"
              className="flex items-start gap-2 rounded-xl border border-warning-line bg-warning-soft px-4 py-3 text-sm text-warning-ink"
            >
              <span aria-hidden="true" className="mt-0.5 text-base">
                {notice}
              </span>
            </div>
          ) : null}
          <OutfitCard
            look={look}
            swapCandidates={swapCandidates}
            onRegenerate={async () => {
              const fresh = await runGenerate();
              return fresh ?? look;
            }}
          />
        </div>
      ) : look ? (
        <EmptyState
          icon={<ShirtIcon className="h-5 w-5" />}
          title={t("today.emptyTitle")}
          description={t("today.emptyDescription")}
          action={
            <Button type="button" onClick={runGenerate} loading={generating}>
              {t("today.firstLook")}
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={<ShirtIcon className="h-5 w-5" />}
          title={wardrobeCount === 0 ? t("today.emptyTitle") : t("today.readyTitle")}
          description={
            wardrobeCount === 0 ? t("today.emptyDescription") : t("today.readyDescription")
          }
          action={
            <Button type="button" onClick={runGenerate} loading={generating}>
              {t("today.firstLook")}
            </Button>
          }
        />
      )}
    </div>
  );
}