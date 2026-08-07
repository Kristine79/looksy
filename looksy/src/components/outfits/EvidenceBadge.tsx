export interface EvidenceBadgeProps {
  text: string;
}

export function evidenceIcon(text: string): { icon: string; tone: string } {
  const lower = text.toLowerCase();
  if (/palette|color/i.test(lower)) return { icon: "🎨", tone: "bg-tertiary-100 text-tertiary-800" };
  if (/learned|memory|preference/i.test(lower)) return { icon: "🧠", tone: "bg-primary-100 text-primary-800" };
  if (/feedback|rating|actions/i.test(lower)) return { icon: "👍", tone: "bg-primary-100 text-primary-800" };
  if (/saved|save/i.test(lower)) return { icon: "⭐", tone: "bg-warning/10 text-warning" };
  if (/worn|wore|rotation|wear/i.test(lower)) return { icon: "⏱️", tone: "bg-info/10 text-info" };
  if (/weather|°c|temperature/i.test(lower)) return { icon: "🌤️", tone: "bg-info/10 text-info" };
  return { icon: "✓", tone: "bg-neutral-100 text-neutral-600" };
}

/**
 * One verified fact from user data — the visible part of the Trust Layer.
 * Never generic AI talk: every badge is grounded in wardrobe/feedback history.
 */
export function EvidenceBadge({ text }: EvidenceBadgeProps) {
  const { icon, tone } = evidenceIcon(text);
  return (
    <li className="flex items-start gap-2 rounded-lg bg-neutral-50 px-3 py-2">
      <span className="mt-0.5 shrink-0 text-xs" aria-hidden="true">
        {icon}
      </span>
      <span className="text-xs leading-relaxed text-neutral-600">{text}</span>
      <span className={`ml-auto mt-0.5 hidden shrink-0 rounded-full px-1.5 text-[9px] font-semibold uppercase tracking-wide sm:inline ${tone}`}>
        data
      </span>
    </li>
  );
}
