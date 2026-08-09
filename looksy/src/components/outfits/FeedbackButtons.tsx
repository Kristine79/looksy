"use client";

import { useState, type ComponentType, type SVGProps } from "react";
import type { LookItem, TodayLookResult } from "@/modules/recommendations/server";
import {
  changeItemAction,
  loveOutfitAction,
  notForMeAction,
  woreOutfitAction,
} from "@/modules/outfits/actions";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useTranslation } from "@/i18n/locale-provider";
import { localCategory } from "@/i18n/presentation";
import { HeartIcon, ShirtIcon, SwapIcon, XCircleIcon } from "@/components/ui/icons";

export type FeedbackAction = "love" | "wore" | "change" | "skip";

export interface FeedbackButtonsProps {
  look: TodayLookResult;
  onRecorded?: (action: FeedbackAction) => void;
  onRegenerate?: () => Promise<TodayLookResult>;
  swapCandidates?: LookItem[];
}

function ActionButton({
  action: _action,
  label,
  Icon,
  disabled,
  pending,
  onClick,
}: {
  action: FeedbackAction;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  disabled: boolean;
  pending: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex flex-1 flex-col items-center gap-1.5 rounded-xl border border-line bg-surface px-2 py-3 text-xs font-medium text-muted transition-colors hover:border-accent-soft-line hover:bg-accent-soft/50 disabled:opacity-50"
    >
      {pending ? <Spinner className="h-4 w-4 text-accent" /> : <Icon className="h-5 w-5 text-muted" />}
      <span>{label}</span>
    </button>
  );
}

export function FeedbackButtons({
  look,
  onRecorded,
  onRegenerate,
  swapCandidates = [],
}: FeedbackButtonsProps) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState<FeedbackAction | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [swapping, setSwapping] = useState(false);
  const [swapOut, setSwapOut] = useState<string>(look.items[0]?.item.id ?? "");
  const [swapIn, setSwapIn] = useState<string>(swapCandidates[0]?.item.id ?? "");

  async function run(action: FeedbackAction, handler: () => Promise<unknown>) {
    if (busy) return;
    setBusy(action);
    setNotice(null);
    try {
      await handler();
      onRecorded?.(action);
      setNotice(noticeFor(action));
      if ((action === "change" || action === "skip") && onRegenerate) {
        await onRegenerate();
      }
    } catch {
      setNotice(t("feedback.error"));
    } finally {
      setBusy(null);
    }
  }

  function noticeFor(action: FeedbackAction): string {
    switch (action) {
      case "love":
        return t("feedback.loveNotice");
      case "wore":
        return t("feedback.woreNotice");
      case "change":
        return t("feedback.changeNotice");
      case "skip":
        return t("feedback.skipNotice");
    }
  }

  const handlers: Record<FeedbackAction, () => Promise<unknown>> = {
    love: () => loveOutfitAction(look.outfitId),
    wore: () => woreOutfitAction(look.outfitId, look.items.map((entry) => entry.item.id)),
    change: () => changeItemAction(look.outfitId, swapOut, swapIn || null),
    skip: () => notForMeAction(look.outfitId, { occasion: look.occasion ?? undefined }),
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="overline text-accent-text">{t("feedback.title")}</span>
        <span className="text-sm text-muted">{t("feedback.helper")}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <ActionButton
          action="love"
          label={t("feedback.love")}
          Icon={HeartIcon}
          disabled={busy !== null}
          pending={busy === "love"}
          onClick={() => run("love", handlers.love)}
        />
        <ActionButton
          action="wore"
          label={t("feedback.wore")}
          Icon={ShirtIcon}
          disabled={busy !== null}
          pending={busy === "wore"}
          onClick={() => run("wore", handlers.wore)}
        />
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => setSwapping((v) => !v)}
          className="flex flex-1 flex-col items-center gap-1.5 rounded-xl border border-line bg-surface px-2 py-3 text-xs font-medium text-muted transition-colors hover:border-accent-soft-line hover:bg-accent-soft/50 disabled:opacity-50"
        >
          {busy === "change" ? (
            <Spinner className="h-4 w-4 text-accent" />
          ) : (
            <SwapIcon className="h-5 w-5 text-muted" />
          )}
          <span>{t("feedback.change")}</span>
        </button>
        <ActionButton
          action="skip"
          label={t("feedback.skip")}
          Icon={XCircleIcon}
          disabled={busy !== null}
          pending={busy === "skip"}
          onClick={() => run("skip", handlers.skip)}
        />
      </div>

      {swapping ? (
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="mb-3 text-sm font-medium text-ink">{t("feedback.swapTitle")}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] text-faint">{t("feedback.replaceLabel")}</span>
              <select
                value={swapOut}
                onChange={(event) => setSwapOut(event.target.value)}
                className="h-9 w-full rounded-[8px] border border-line-strong bg-surface px-2 text-xs text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-interactive"
              >
                {look.items.map((entry) => {
                  const cat = localCategory(t, entry.item.type);
                  return (
                    <option key={entry.item.id} value={entry.item.id}>
                      {cat}
                      {entry.item.subType ? ` · ${entry.item.subType.charAt(0).toUpperCase() + entry.item.subType.slice(1)}` : ""}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] text-faint">{t("feedback.withLabel")}</span>
              <select
                value={swapIn}
                onChange={(event) => setSwapIn(event.target.value)}
                className="h-9 w-full rounded-[8px] border border-line-strong bg-surface px-2 text-xs text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-interactive"
              >
                {swapCandidates.length === 0 ? (
                  <option value="">{t("feedback.noneYet")}</option>
                ) : null}
                {swapCandidates.map((entry) => {
                  const cat = localCategory(t, entry.item.type);
                  return (
                    <option key={entry.item.id} value={entry.item.id}>
                      {cat}
                      {entry.item.subType ? ` · ${entry.item.subType.charAt(0).toUpperCase() + entry.item.subType.slice(1)}` : ""}
                    </option>
                  );
                })}
              </select>
            </label>
          </div>
          <Button
            type="button"
            size="sm"
            className="mt-3"
            disabled={!swapOut || (!swapIn && swapCandidates.length > 0)}
            loading={busy === "change"}
            onClick={() => {
              setSwapping(false);
              run("change", handlers.change);
            }}
          >
            {t("feedback.runSwap")}
          </Button>
        </div>
      ) : null}

      {notice ? (
        <p className="text-center text-sm font-medium text-accent-soft-ink" role="status">
          {notice}
        </p>
      ) : null}
    </div>
  );
}