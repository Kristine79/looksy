"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { useTranslation } from "@/i18n/locale-provider";
import { ChevronDownIcon } from "@/components/ui/icons";

interface HelpSection {
  titleKey: string;
  bodyKeys: string[];
  /** true renders the body as a numbered list of steps */
  steps?: boolean;
}

const SECTIONS: HelpSection[] = [
  {
    titleKey: "help.sGettingStarted",
    steps: true,
    bodyKeys: ["help.bGettingStarted1", "help.bGettingStarted2", "help.bGettingStarted3", "help.bGettingStarted4"],
  },
  {
    titleKey: "help.sHowItWorks",
    bodyKeys: ["help.bHowItWorks1", "help.bHowItWorks2", "help.bHowItWorks3"],
  },
  {
    titleKey: "help.sWardrobe",
    bodyKeys: ["help.bWardrobe1", "help.bWardrobe2", "help.bWardrobe3"],
  },
  {
    titleKey: "help.sTodaysLook",
    bodyKeys: ["help.bTodaysLook1", "help.bTodaysLook2"],
  },
  {
    titleKey: "help.sFeedback",
    bodyKeys: ["help.bFeedback1", "help.bFeedback2"],
  },
  {
    titleKey: "help.sMemory",
    bodyKeys: ["help.bMemory1", "help.bMemory2"],
  },
  {
    titleKey: "help.sAnalysisFailed",
    bodyKeys: ["help.bAnalysisFailed1", "help.bAnalysisFailed2"],
  },
  {
    titleKey: "help.sDemoMode",
    bodyKeys: ["help.bDemoMode1", "help.bDemoMode2"],
  },
  {
    titleKey: "help.sYourData",
    bodyKeys: ["help.bYourData1", "help.bYourData2"],
  },
];

/**
 * In-app product guide — calm, compact and fully localized. Accordion keeps
 * every answer one tap away; all copy describes only real product flows.
 */
export function HelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <Dialog open={open} onClose={onClose} variant="centered" title={t("help.title")}>
      <p className="px-5 pb-1 pt-4 text-sm leading-relaxed text-muted sm:px-6">
        {t("help.subtitle")}
      </p>
      <div className="px-5 py-4 sm:px-6">
        {SECTIONS.map((section, index) => {
          const expanded = openIndex === index;
          const buttonId = `help-trigger-${index}`;
          const panelId = `help-panel-${index}`;
          return (
            <div key={section.titleKey} className="border-b border-line last:border-b-0">
              <h3>
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(expanded ? -1 : index)}
                  className="flex w-full cursor-pointer items-center justify-between gap-3 py-3 text-sm font-medium text-ink transition-colors hover:text-accent-soft-ink"
                >
                  {t(section.titleKey)}
                  <ChevronDownIcon
                    className={`h-4 w-4 shrink-0 text-faint transition-transform duration-200 ${
                      expanded ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                hidden={!expanded}
                className="pb-4"
              >
                {section.steps ? (
                  <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
                    {section.bodyKeys.map((key) => (
                      <li key={key}>{t(key)}</li>
                    ))}
                  </ol>
                ) : (
                  <div className="space-y-2.5 text-sm leading-relaxed text-muted">
                    {section.bodyKeys.map((key) => (
                      <p key={key}>{t(key)}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Dialog>
  );
}
