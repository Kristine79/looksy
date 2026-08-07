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

export interface TodayLookExperienceProps {
  initialLook: TodayLookResult | null;
  wardrobeCount: number;
  swapCandidates?: LookItem[];
}

/**
 * The main product screen — generates, displays and refines Today's Look.
 * Server actions stay the only data path; this component only orchestrates
 * loading/error/empty states around them.
 */
export function TodayLookExperience({
  initialLook,
  wardrobeCount,
  swapCandidates = [],
}: TodayLookExperienceProps) {
  const [look, setLook] = useState<TodayLookResult | null>(initialLook);
  const [occasion, setOccasion] = useState<Occasion | "">("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const fresh = await getTodayLookAction({
        occasion: occasion || null,
      });
      setLook(fresh);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate a look right now");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              Today&apos;s Look
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Built from <span className="font-semibold text-neutral-700">{wardrobeCount} items</span>{" "}
              in your wardrobe — and everything LOOKSY has learned about you.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="occasion">
              Occasion
            </label>
            <select
              id="occasion"
              value={occasion}
              onChange={(event) => setOccasion(event.target.value as Occasion)}
              className="h-10 rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-800 focus:border-primary-500 focus:outline-none"
            >
              <option value="">No occasion</option>
              {OCCASIONS.map((value) => (
                <option key={value} value={value}>
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </option>
              ))}
            </select>
            <Button type="button" onClick={generate} loading={generating}>
              {look ? "New look" : "Generate look"}
            </Button>
          </div>
        </div>

        {generating ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-neutral-200 bg-white p-8">
              <div className="flex flex-col items-center gap-4">
                <Spinner className="h-8 w-8 text-primary-600" />
                <div className="text-center">
                  <p className="text-sm font-semibold text-neutral-800">
                    LOOKSY is building your look…
                  </p>
                  <p className="mt-1 max-w-md text-xs text-neutral-500">
                    Matching your wardrobe against your palette, wear history and saved
                    outfits — then explaining every choice.
                  </p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="aspect-[3/4]" />
                ))}
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-error/30 bg-error/5 p-8 text-center">
            <p className="text-sm font-medium text-error">{error}</p>
            <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={generate}>
              Try again
            </Button>
          </div>
        ) : look ? (
          <OutfitCard
            look={look}
            swapCandidates={swapCandidates}
            onRegenerate={async () => {
              const fresh = await getTodayLookAction({ occasion: occasion || null });
              setLook(fresh);
              return fresh;
            }}
          />
        ) : (
          <EmptyState
            title={wardrobeCount === 0 ? "Your wardrobe is empty" : "Ready when you are"}
            description={
              wardrobeCount === 0
                ? "Add a few items to your wardrobe and LOOKSY will start building looks that match your style."
                : "Choose an occasion and LOOKSY will build an outfit from your wardrobe — with real reasons for every choice."
            }
            action={
              <Button type="button" onClick={generate} loading={generating}>
                Generate my first look
              </Button>
            }
          />
        )}
      </section>
    </div>
  );
}
