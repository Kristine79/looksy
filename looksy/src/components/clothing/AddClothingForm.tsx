"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addToWardrobeAction, reprocessItemAction } from "@/modules/closet/actions";
import { ImageFileError, MAX_UPLOAD_IMAGE_SIZE_MB, readImageFile } from "@/lib/image";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useTranslation } from "@/i18n/locale-provider";
import { CameraIcon, CheckCircleIcon, CheckIcon } from "@/components/ui/icons";

type Phase = "idle" | "uploaded" | "analyzing" | "added" | "error";

interface AddClothingFormProps {
  autoFocus?: boolean;
  onAdded?: () => void;
}

function currentStep(phase: Phase): number {
  if (phase === "uploaded") return 1;
  if (phase === "analyzing") return 2;
  if (phase === "added") return 3;
  return 0;
}

/**
 * Add Clothing flow — a compact, calm inline upload:
 * photo → AI analysis → added. Styled as part of the wardrobe itself,
 * not a separate technical tool.
 */
export function AddClothingForm({ autoFocus = false, onAdded }: AddClothingFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [itemId, setItemId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const step = currentStep(phase);
  const stepLabels = [t("add.step1"), t("add.step2"), t("add.step3")];

  async function handleFile(file: File | undefined | null) {
    if (!file || busy) return;
    setError(null);
    setPhase("idle");
    try {
      const { dataUrl } = await readImageFile(file);
      setPreview(dataUrl);
      setPhase("uploaded");
    } catch (err) {
      if (err instanceof ImageFileError && err.code === "too-large") {
        setError(t("add.errTooLarge", { mb: MAX_UPLOAD_IMAGE_SIZE_MB }));
      } else {
        setError(err instanceof Error ? err.message : t("add.errRead"));
      }
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
        setError(t("add.errSaved"));
        setPhase("error");
      } else {
        setPhase("added");
        onAdded?.();
      }
      router.refresh();
    } catch {
      setError(t("add.errGeneric"));
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
        setError(t("add.errSaved"));
      }
      router.refresh();
    } catch {
      setError(t("add.errGeneric"));
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
    <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-ink">{t("add.title")}</h3>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">{t("add.hint")}</p>
      </div>

      <div className="relative mb-4" aria-hidden="true">
        <div className="absolute left-[16.66%] right-[16.66%] top-[7px] h-px bg-line" />
        <div className="relative grid grid-cols-3">
          {stepLabels.map((label, index) => {
            const state = step > index + 1 ? "done" : step === index + 1 ? "current" : "todo";
            return (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <span
                  className={`flex h-[14px] w-[14px] items-center justify-center rounded-full border bg-surface ${
                    state === "done"
                      ? "border-accent bg-accent text-accent-ink"
                      : state === "current"
                        ? "border-accent"
                        : "border-line-strong"
                  }`}
                >
                  {state === "done" ? (
                    <CheckIcon className="h-2.5 w-2.5" />
                  ) : state === "current" ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  ) : null}
                </span>
                <span
                  className={`text-[11px] ${
                    state === "todo" ? "text-faint" : "text-muted"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {phase === "idle" || phase === "error" ? (
        <div className="space-y-3">
          <label
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-7 text-center transition-colors ${
              phase === "error"
                ? "border-error-line bg-error-soft/40"
                : "border-line-strong hover:border-accent-soft-line hover:bg-accent-soft/30"
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
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-muted">
              <CameraIcon className="h-4.5 w-4.5" />
            </span>
            <span className="text-sm font-medium text-ink">{t("add.choose")}</span>
            <span className="text-[11px] text-muted">
              {t("add.limit", { mb: MAX_UPLOAD_IMAGE_SIZE_MB })}
            </span>
          </label>

          <input
            type="text"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={t("add.notesPlaceholder")}
            className="h-10 w-full rounded-[8px] border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-interactive"
          />

          {error ? (
            <p className="text-xs font-medium text-error-ink" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}

      {phase === "uploaded" && preview ? (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-line bg-surface-muted p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt={t("add.step1")}
              className="mx-auto h-auto max-h-80 w-full object-contain"
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={handleSubmit} loading={busy}>
              {t("add.submit")}
            </Button>
            <Button type="button" variant="ghost" onClick={reset} disabled={busy}>
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      ) : null}

      {phase === "analyzing" ? (
        <div className="flex flex-col items-center gap-3 py-5">
          <Spinner className="h-6 w-6 text-accent" />
          <p className="text-sm font-medium text-ink">{t("add.analyzing")}</p>
          <p className="max-w-xs text-center text-xs leading-relaxed text-muted">
            {t("add.analyzingHint")}
          </p>
        </div>
      ) : null}

      {phase === "added" ? (
        <div className="flex flex-col items-center gap-3 py-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent-soft-ink">
            <CheckCircleIcon className="h-5 w-5" />
          </span>
          <p className="text-sm font-medium text-ink">{t("add.addedTitle")}</p>
          <p className="max-w-xs text-center text-xs leading-relaxed text-muted">
            {t("add.addedHint")}
          </p>
          <Button type="button" variant="secondary" size="sm" onClick={reset}>
            {t("add.another")}
          </Button>
        </div>
      ) : null}

      {phase === "error" && itemId ? (
        <div className="space-y-3">
          <Button type="button" onClick={handleRetryAnalysis} loading={busy}>
            {t("add.retryAnalysis")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}