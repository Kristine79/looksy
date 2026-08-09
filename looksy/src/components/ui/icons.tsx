import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps): IconProps {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    ...props,
  };
}

export function HeartIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 20.5c-.3 0-.6-.1-.9-.3C7.2 17.6 3.5 14.2 3.5 9.9A5.4 5.4 0 0 1 9 4.5c1.2 0 2.3.4 3 1.2.7-.8 1.8-1.2 3-1.2a5.4 5.4 0 0 1 5.5 5.4c0 4.3-3.7 7.7-7.6 10.3-.3.2-.6.3-.9.3Z" />
    </svg>
  );
}

export function ShirtIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7.5 4.5 3.5 7l1.8 4 .9-.5V19a1.5 1.5 0 0 0 1.5 1.5h8.6a1.5 1.5 0 0 0 1.5-1.5v-8.6l.9.6 1.8-4-4-2.5-.4 1.6c-.2.9-1 1.4-1.9 1.4a1.9 1.9 0 0 1-1.9-1.4L10.7 4.5a2 2 0 0 1-3.2 0L7.5 4.5Z" />
    </svg>
  );
}

export function SwapIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 7h13l-3-3M20 17H7l3 3" />
    </svg>
  );
}

export function XCircleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m9.5 9.5 5 5m0-5-5 5" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.5 4.5l1.4 1.4M18.1 18.1l1.4 1.4M2.5 12h2M19.5 12h2M4.5 19.5l1.4-1.4M18.1 5.9l1.4-1.4" />
    </svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20 15.2A8.5 8.5 0 0 1 8.8 4 8.5 8.5 0 1 0 20 15.2Z" />
    </svg>
  );
}

export function MonitorIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="5" width="17" height="12" rx="1.5" />
      <path d="M9 21h6M12 17v4" />
    </svg>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2L9 5h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9Z" />
      <circle cx="12" cy="12.5" r="3.2" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4.5 6.5h15M9.5 6.5V5h5v1.5M6.5 6.5 7.5 19h9l1-12.5M10 10v6M14 10v6" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </svg>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 4.5 13.4 9l4.6 1.4L13.4 11.8 12 16.3 10.6 11.8 6 10.4 10.6 9 12 4.5Z" />
      <path d="M18.5 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" />
    </svg>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M19 8.5A8 8 0 1 0 20 12M19 8.5V4.5M19 8.5H15" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 12h16M14 6l6 6-6 6" />
    </svg>
  );
}

export function TagIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 4.5V10l8.5 8.5a1.8 1.8 0 0 0 2.5 0l5-5a1.8 1.8 0 0 0 0-2.5L11.5 4H4Z" />
      <circle cx="8.5" cy="8.5" r="1.3" />
    </svg>
  );
}

export function ImageOffIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="5" width="16" height="14" rx="1.5" />
      <path d="m4.5 16 4.5-4.5 3 3L16 11l4 4.5M5 19 20 5M8 9.5h.01" />
    </svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.3 2.3 3.5 5.3 3.5 8.5s-1.2 6.2-3.5 8.5c-2.3-2.3-3.5-5.3-3.5-8.5s1.2-6.2 3.5-8.5Z" />
    </svg>
  );
}

export const iconMap = {
  heart: HeartIcon,
  shirt: ShirtIcon,
  swap: SwapIcon,
  xCircle: XCircleIcon,
  plus: PlusIcon,
  sun: SunIcon,
  moon: MoonIcon,
  monitor: MonitorIcon,
  camera: CameraIcon,
  trash: TrashIcon,
  check: CheckIcon,
  checkCircle: CheckCircleIcon,
  sparkle: SparkleIcon,
  refresh: RefreshIcon,
  arrowRight: ArrowRightIcon,
  tag: TagIcon,
  imageOff: ImageOffIcon,
  globe: GlobeIcon,
} as const;

export type IconName = keyof typeof iconMap;