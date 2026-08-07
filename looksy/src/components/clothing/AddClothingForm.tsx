"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addToWardrobeAction, reprocessItemAction } from "@/modules/closet/actions";
import { readImageFile } from "@/lib/image";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

type Phase = "idle" | "uploaded" | "analyzing" | "added" | "error";

interface AddClothingFormProps {
  autoFocus?: boolean;
}

const STEPS = [
  { key: 1, label: "Photo uploaded" },
  { key: 2, label: "LOOKSY is analyzing this item" },
  { key: 3, label: "Added to wardrobe" },
];

function currentStep(phase: Phase): number {
  if (phase === "uploaded") return 1;
  if (phase === "analyzing") return 2;
  if (phase === "added") return 3;
  return 0;
}

/**
 * Add Clothing flow:
 *
 * 1. Photo uploaded   — local preview after client-side resize
 * 2. AI is analyzing  — vision analysis + embedding (server pipeline)
 * 3. Added to wardrobe — item row with AI metadata
 */
export function AddClothingForm({ autoFocus = false }: AddClothingFormProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [itemId, setItemId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const step = currentStep(phase);

  async function handleFile(file: File | undefined | null) {
    if (!file || busy) return;
    setError(null);
    setPhase("idle");
    try {
      const { dataUrl } = await readImageFile(file);
      setPreview(dataUrl);
      setPhase("uploaded");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read this image");
      setPhase("error");
    }
  }

  async function handleSubmit() {
    if (!preview || busy) return;
    setBusy(true);
    setError(null);
    setPhase("analyzing");
    try {
      const result = await addToWardrobeAction({
        imageData: preview,
        notes: notes.trim() || null,
      });
      setItemId(result.item.id);
      if (result.analysis.status === "failed") {
        setError("The item was saved, but AI analysis failed. You can retry.");
        setPhase("error");
      } else {
        setPhase("added");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — please try again");
      setPhase("error");
    } finally {
      setBusy(false);
    }
  }

  async function handleRetryAnalysis() {
    if (!itemId || busy) return;
    setBusy(true);
    setError(null);
    setPhase("analyzing");
    try {
      const outcome = await reprocessItemAction(itemId);
      setPhase(outcome.status === "completed" ? "added" : "error");
      if (outcome.status !== "completed") {
        setError("Analysis failed again — check your AI provider configuration.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry failed — please try again");
      setPhase("error");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setPhase("idle");
    setPreview(null);
    setNotes("");
    setError(null);
    setItemId(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-neutral-900">Add clothing to your wardrobe</h3>
        <p className="mt-0.5 text-xs text-neutral-500">
          Upload a photo — LOOKSY will analyze the item and remember it.
        </p>
      </div>

      <ol className="mb-4 space-y-2" aria-label="Add item progress">
        {STEPS.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-xs">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                step > s.key
                  ? "bg-primary-700 text-white"
                  : step === s.key
                    ? "bg-primary-100 text-primary-800"
                    : "bg-neutral-100 text-neutral-400"
              }`}
            >
              {step > s.key ? "✓" : s.key}
            </span>
            <span
              className={
                step >= s.key ? "font-medium text-neutral-800" : "text-neutral-400"
              }
            >
              {s.label}
            </span>
            {step === s.key && (phase === "analyzing" || phase === "uploaded") ? (
              <Spinner className="h-3 w-3 text-primary-600" />
            ) : null}
          </li>
        ))}
      </ol>

      {phase === "idle" || phase === "error" ? (
        <div className="space-y-3">
          <label
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
              phase === "error" ? "border-error/40 bg-error/5" : "border-neutral-300 hover:border-primary-400 hover:bg-primary-50"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => handleFile(event.target.files?.[0])}
              autoFocus={autoFocus}
            />
            <span className="text-2xl" aria-hidden="true">
              📸
            </span>
            <span className="text-sm font-medium text-neutral-700">
              Click to choose a photo
            </span>
            <span className="text-[11px] text-neutral-400">JPG or PNG, up to 4MB</span>
          </label>

          <input
            type="text"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Notes (optional) — e.g. “favorite jeans”"
            className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none"
          />

          {error ? (
            <p className="text-xs font-medium text-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}

      {phase === "uploaded" && preview ? (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-neutral-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Item preview" className="h-40 w-full object-cover" />
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={handleSubmit} loading={busy}>
              Analyze and add
            </Button>
            <Button type="button" variant="ghost" onClick={reset} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {phase === "analyzing" ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <Spinner className="h-8 w-8 text-primary-600" />
          <p className="text-sm font-medium text-neutral-700">
            LOOKSY is analyzing this item…
          </p>
          <p className="max-w-xs text-center text-xs text-neutral-500">
            Vision model is reading colors, fabric and style — then teaching the
            recommendation engine about this piece.
          </p>
        </div>
      ) : null}

      {phase === "added" ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-2xl">
            ✨
          </span>
          <p className="text-sm font-semibold text-neutral-800">
            Item added to your wardrobe
          </p>
          <p className="max-w-xs text-center text-xs text-neutral-500">
            LOOKSY will now consider this item when building your looks.
          </p>
          <Button type="button" variant="secondary" size="sm" onClick={reset}>
            Add another item
          </Button>
        </div>
      ) : null}

      {phase === "error" && itemId ? (
        <div className="space-y-3">
          <Button type="button" onClick={handleRetryAnalysis} loading={busy}>
            Retry analysis
          </Button>
        </div>
      ) : null}
    </div>
  );
}
