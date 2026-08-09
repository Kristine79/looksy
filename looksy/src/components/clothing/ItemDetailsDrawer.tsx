"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WardrobeItemWithPhotos } from "@/modules/closet";
import { resolvePhotoUrl } from "@/modules/storage";
import { archiveItemFormAction, reprocessItemAction } from "@/modules/closet/actions";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/i18n/locale-provider";
import { localCategory, localColorName } from "@/i18n/presentation";
import { RefreshIcon, ShirtIcon, TrashIcon } from "@/components/ui/icons";

export interface ItemDetailsDrawerProps {
  item: WardrobeItemWithPhotos;
  onClose: () => void;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const AI_STATUS_KEY: Record<string, string> = {
  pending: "ai.pending",
  processing: "ai.processing",
  completed: "ai.completed",
  needs_review: "ai.needsReview",
  failed: "ai.failed",
};

/**
 * Item details — opened from a wardrobe card. Reads only existing item data
 * and reuses existing actions (re-analysis, archive). No placeholders for
 * missing fields: an absent value simply omits its row.
 */
export function ItemDetailsDrawer({ item, onClose }: ItemDetailsDrawerProps) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [busy, setBusy] = useState<"analyze" | "remove" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const primaryPhoto = item.photos.find((p) => p.isPrimary) ?? item.photos[0];
  const imageUrl = primaryPhoto ? resolvePhotoUrl(primaryPhoto) : null;

  const analyzing = item.aiStatus === "pending" || item.aiStatus === "processing";
  const categoryLabel = item.type !== "unknown" ? localCategory(t, item.type) : null;
  const name = item.subType ? capitalize(item.subType) : categoryLabel;
  const fallbackTitle = t("details.eyebrow");
  const title = analyzing
    ? t("clothing.analyzingLabel")
    : name ?? fallbackTitle;
  const eyebrow = title === fallbackTitle ? undefined : t("details.eyebrow");
  const statusLabel = item.aiStatus ? t(AI_STATUS_KEY[item.aiStatus] ?? "ai.pending") : null;
  const canReanalyze = item.aiStatus !== "completed" && imageUrl !== null;

  async function handleReanalyze() {
    if (busy || !canReanalyze) return;
    setBusy("analyze");
    setNotice(null);
    try {
      const outcome = await reprocessItemAction(item.id);
      setNotice(outcome.status === "completed" ? t("details.reanalyzeSuccess") : t("details.reanalyzeFailed"));
      router.refresh();
    } catch {
      setNotice(t("details.reanalyzeFailed"));
    } finally {
      setBusy(null);
    }
  }

  async function handleRemove() {
    if (busy) return;
    setBusy("remove");
    try {
      await archiveItemFormAction(item.id);
      onClose();
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      variant="sheet"
      eyebrow={eyebrow}
      title={title}
    >
      <div className="p-5 sm:p-6">
        <div className="overflow-hidden rounded-xl border border-line bg-surface-muted">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={t("clothing.altPhoto", { label: title })}
              className="mx-auto h-auto max-h-[44vh] w-full object-contain md:max-h-[50vh]"
            />
          ) : (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-faint">
              <ShirtIcon className="h-7 w-7" />
              <span className="text-[11px]">{t("clothing.noPhotoLabel")}</span>
            </div>
          )}
        </div>

        <dl className="mt-5 space-y-3 text-sm">
          {categoryLabel ? (
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-[11px] uppercase tracking-[0.12em] text-faint">
                {t("details.category")}
              </dt>
              <dd className="text-right text-ink">{categoryLabel}</dd>
            </div>
          ) : null}

          {item.brand ? (
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-[11px] uppercase tracking-[0.12em] text-faint">
                {t("details.brand")}
              </dt>
              <dd className="text-right text-ink">{item.brand}</dd>
            </div>
          ) : null}

          {item.colors.length > 0 ? (
            <div className="flex items-center justify-between gap-4">
              <dt className="text-[11px] uppercase tracking-[0.12em] text-faint">
                {t("details.colors")}
              </dt>
              <dd className="flex items-center justify-end gap-2">
                <span className="flex items-center gap-1.5">
                  {item.colors.map((color) => (
                    <span
                      key={`${color.name}-${color.hex}`}
                      title={localColorName(t, color.name)}
                      className="h-4 w-4 rounded-full border border-line"
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
                </span>
                <span className="text-right text-ink">
                  {item.colors.map((color) => capitalize(localColorName(t, color.name))).join(", ")}
                </span>
              </dd>
            </div>
          ) : null}

          {item.material ? (
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-[11px] uppercase tracking-[0.12em] text-faint">
                {t("details.material")}
              </dt>
              <dd className="text-right text-ink">{capitalize(item.material)}</dd>
            </div>
          ) : null}

          {item.pattern ? (
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-[11px] uppercase tracking-[0.12em] text-faint">
                {t("details.pattern")}
              </dt>
              <dd className="text-right text-ink">{capitalize(item.pattern)}</dd>
            </div>
          ) : null}

          {item.notes ? (
            <div className="flex flex-col gap-1">
              <dt className="text-[11px] uppercase tracking-[0.12em] text-faint">
                {t("details.notes")}
              </dt>
              <dd className="whitespace-pre-wrap text-ink-2">{item.notes}</dd>
            </div>
          ) : null}

          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-[11px] uppercase tracking-[0.12em] text-faint">
              {t("details.added")}
            </dt>
            <dd className="text-right text-ink">
              {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(item.createdAt)}
            </dd>
          </div>

          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-[11px] uppercase tracking-[0.12em] text-faint">
              {t("details.analysis")}
            </dt>
            <dd className="text-right text-ink">
              {item.aiStatus === "completed" && item.aiConfidence != null
                ? t("ai.completedWithConfidence", { pct: Math.round(item.aiConfidence * 100) })
                : statusLabel}
            </dd>
          </div>
        </dl>

        {notice ? (
          <p role="status" className="mt-4 text-sm font-medium text-accent-soft-ink">
            {notice}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2">
          {canReanalyze ? (
            <Button type="button" onClick={handleReanalyze} loading={busy === "analyze"}>
              <RefreshIcon className="h-4 w-4" />
              {busy === "analyze" ? t("details.reanalyzing") : t("clothing.reanalyze")}
            </Button>
          ) : null}
          <Button type="button" variant="danger" onClick={handleRemove} loading={busy === "remove"}>
            <TrashIcon className="h-4 w-4" />
            {t("clothing.archive")}
          </Button>
        </div>

        <p className="mt-8 border-t border-line pt-4 text-[11px] text-faint">
          {t("details.looksComingSoon")}
        </p>
      </div>
    </Dialog>
  );
}
