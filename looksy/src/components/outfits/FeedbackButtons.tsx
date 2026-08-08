"use client";

import { useState } from "react";
import type { LookItem, TodayLookResult } from "@/modules/recommendations/server";
import {
  changeItemAction,
  loveOutfitAction,
  notForMeAction,
  woreOutfitAction,
} from "@/modules/outfits/actions";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export type FeedbackAction = "love" | "wore" | "change" | "skip";

export interface FeedbackButtonsProps {
  look: TodayLookResult;
  /** Called after the action is recorded so the parent can refresh UI state. */
  onRecorded?: (action: FeedbackAction) => void;
  /** Called when a new look should be generated (skip / change item). */
  onRegenerate?: () => Promise<TodayLookResult>;
  /** Wardrobe items available as swap-in candidates (excludes current look items). */
  swapCandidates?: LookItem[];
}

/**
 * Feedback Loop — four signals that teach LOOKSY:
 *
 * ❤️ Love        -> recordSave   (outfit marked as saved)
 * 👕 Wore it     -> recordWear   (wear log + wear counters)
 * 🔄 Change item -> recordSwap   (swap signal + regeneration)
 * 👎 Not for me  -> recordSkip   (dismissal + regeneration)
 */
export function FeedbackButtons({
  look,
  onRecorded,
  onRegenerate,
  swapCandidates = [],
}: FeedbackButtonsProps) {
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
      setNotice("Something went wrong — please try again.");
    } finally {
      setBusy(null);
    }
  }

  function noticeFor(action: FeedbackAction): string {
    switch (action) {
      case "love":
        return "Saved — this look goes into your favorites.";
      case "wore":
        return "Noted — I'll use this when planning future looks.";
      case "change":
        return "Swap recorded.";
      case "skip":
        return "Understood — this wasn't for you.";
    }
  }

  const actionButton = (action: FeedbackAction, label: string, emoji: string) => (
    <button
      type="button"
      disabled={busy !== null}
      onClick={() => run(action, () => handlers[action]())}
      className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-neutral-200 bg-white px-2 py-3 text-xs font-medium text-neutral-700 transition-colors hover:border-primary-300 hover:bg-primary-50 disabled:opacity-50"
    >
      {busy === action ? <Spinner className="h-4 w-4" /> : <span className="text-base">{emoji}</span>}
      {label}
    </button>
  );

  const handlers: Record<FeedbackAction, () => Promise<unknown>> = {
    love: () => loveOutfitAction(look.outfitId),
    wore: () => woreOutfitAction(look.outfitId, look.items.map((entry) => entry.item.id)),
    change: () => changeItemAction(look.outfitId, swapOut, swapIn || null),
    skip: () => notForMeAction(look.outfitId, { occasion: look.occasion ?? undefined }),
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {actionButton("love", "Love", "❤️")}
        {actionButton("wore", "Wore it", "👕")}
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => setSwapping((v) => !v)}
          className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-neutral-200 bg-white px-2 py-3 text-xs font-medium text-neutral-700 transition-colors hover:border-primary-300 hover:bg-primary-50 disabled:opacity-50"
        >
          {busy === "change" ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <span className="text-base" aria-hidden="true">
              🔄
            </span>
          )}
          Change item
        </button>
        {actionButton("skip", "Not for me", "👎")}
      </div>

      {swapping ? (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
          <p className="mb-2 text-xs font-medium text-neutral-700">
            Swap an item and LOOKSY will rebuild the look
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] text-neutral-500">Replace…</span>
              <select
                value={swapOut}
                onChange={(event) => setSwapOut(event.target.value)}
                className="h-9 w-full rounded-lg border border-neutral-300 bg-white px-2 text-xs text-neutral-800"
              >
                {look.items.map((entry) => (
                  <option key={entry.item.id} value={entry.item.id}>
                    {entry.item.type}
                    {entry.item.subType ? ` · ${entry.item.subType}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[11px] text-neutral-500">…with</span>
              <select
                value={swapIn}
                onChange={(event) => setSwapIn(event.target.value)}
                className="h-9 w-full rounded-lg border border-neutral-300 bg-white px-2 text-xs text-neutral-800"
              >
                {swapCandidates.length === 0 ? (
                  <option value="">No other items yet</option>
                ) : null}
                {swapCandidates.map((entry) => (
                  <option key={entry.item.id} value={entry.item.id}>
                    {entry.item.type}
                    {entry.item.subType ? ` · ${entry.item.subType}` : ""}
                  </option>
                ))}
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
            Swap and rebuild look
          </Button>
        </div>
      ) : null}

      {notice ? (
        <p className="text-center text-xs font-medium text-primary-700" role="status">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
