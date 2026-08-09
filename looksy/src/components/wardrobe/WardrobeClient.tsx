"use client";

import { useState } from "react";
import type { WardrobeItemWithPhotos } from "@/modules/closet";
import { ClothingCard } from "@/components/clothing/ClothingCard";
import { ItemDetailsDrawer } from "@/components/clothing/ItemDetailsDrawer";
import { AddClothingForm } from "@/components/clothing/AddClothingForm";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useTranslation } from "@/i18n/locale-provider";
import { localCategory } from "@/i18n/presentation";
import { pluralRu } from "@/i18n";
import { PlusIcon, ShirtIcon } from "@/components/ui/icons";

export interface WardrobeCounts {
  total: number;
  analyzed: number;
  analyzing: number;
  failed: number;
}

export interface WardrobeClientProps {
  items: WardrobeItemWithPhotos[];
  categories: string[];
  activeType?: string;
  counts: WardrobeCounts;
}

/**
 * Wardrobe — the digital closet. The collection is the focus; the add flow
 * stays tucked behind a single primary action and never competes with it.
 */
export function WardrobeClient({
  items,
  categories,
  activeType,
  counts,
}: WardrobeClientProps) {
  const { t, locale } = useTranslation();
  const [adding, setAdding] = useState(items.length === 0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedItem = selectedId
    ? (items.find((item) => item.id === selectedId) ?? null)
    : null;

  const piecesLabel =
    locale === "ru"
      ? pluralRu(counts.total, ["{count} вещь", "{count} вещи", "{count} вещей"]).replace(
          "{count}",
          String(counts.total)
        )
      : t("wardrobe.pieces", { count: counts.total });
  const analyzedLabel =
    locale === "ru"
      ? pluralRu(counts.analyzed, [
          "{count} проанализирована",
          "{count} проанализировано",
          "{count} проанализировано",
        ]).replace("{count}", String(counts.analyzed))
      : t("wardrobe.piecesAnalyzed", { count: counts.analyzed });

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-ink sm:text-3xl">
            {t("wardrobe.title")}
          </h1>
          <p className="mt-1 text-sm text-muted">{t("wardrobe.subtitle")}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="font-medium text-ink-2">{piecesLabel}</span>
            {counts.analyzed > 0 ? (
              <>
                <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
                <span>{analyzedLabel}</span>
              </>
            ) : null}
            {counts.analyzing > 0 ? (
              <>
                <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
                <span>
                  {t("wardrobe.analyzing", { count: counts.analyzing })}
                </span>
              </>
            ) : null}
            {counts.failed > 0 ? (
              <>
                <span className="h-3 w-px bg-line-strong" aria-hidden="true" />
                <span className="text-error-ink">
                  {t("wardrobe.attention", { count: counts.failed })}
                </span>
              </>
            ) : null}
          </div>
        </div>

        <div className="shrink-0">
          <Button
            type="button"
            onClick={() => setAdding((v) => !v)}
            aria-expanded={adding}
            aria-controls="wardrobe-add-form"
          >
            <PlusIcon className="h-4 w-4" />
            {adding ? t("common.close") : t("wardrobe.addItem")}
          </Button>
        </div>
      </section>

      {adding ? (
        <section id="wardrobe-add-form" aria-label={t("wardrobe.addItemAria")}>
          <AddClothingForm onAdded={() => setAdding(false)} />
        </section>
      ) : null}

      {items.length > 0 ? (
        <section>
          {categories.length > 0 ? (
            <div
              className="-mx-4 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:px-0"
              role="group"
              aria-label={t("wardrobe.filterLabel")}
            >
              <div className="flex items-center gap-0 border-b border-line">
                <a
                  href="/dashboard/wardrobe"
                  aria-current={!activeType ? "true" : undefined}
                  className={`relative -mb-px flex h-9 items-center px-3 text-sm transition-colors ${
                    !activeType
                      ? "font-medium text-accent-soft-ink"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {t("wardrobe.filterAll")}
                  {!activeType ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent"
                    />
                  ) : null}
                </a>
                {categories.map((category) => {
                  const active = activeType === category;
                  const label = localCategory(t, category);
                  return (
                    <a
                      key={category}
                      href={`/dashboard/wardrobe?type=${category}`}
                      aria-current={active ? "true" : undefined}
                      className={`relative -mb-px flex h-9 items-center whitespace-nowrap px-3 text-sm transition-colors ${
                        active
                          ? "font-medium text-accent-soft-ink"
                          : "text-muted hover:text-ink"
                      }`}
                    >
                      {label}
                      {active ? (
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent"
                        />
                      ) : null}
                    </a>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {items.map((item) => (
              <ClothingCard key={item.id} item={item} onOpenDetails={(item) => setSelectedId(item.id)} />
            ))}
          </div>
        </section>
      ) : (
        <EmptyState
          icon={<ShirtIcon className="h-5 w-5" />}
          title={t("wardrobe.emptyTitle")}
          description={t("wardrobe.emptyDescription")}
        />
      )}

      {selectedItem ? (
        <ItemDetailsDrawer
          key={selectedItem.id}
          item={selectedItem}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </div>
  );
}