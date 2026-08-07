import type { CSSProperties, ReactNode, SVGProps } from "react"

export function cn(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ")
}

export function Shell({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn("screen-wrap min-h-screen pb-24", className)}
      style={{
        background:
          "radial-gradient(circle at 12% 10%, rgba(217,109,32,0.10), transparent 28%), radial-gradient(circle at 84% 18%, rgba(59,143,159,0.10), transparent 26%), radial-gradient(circle at 72% 88%, rgba(227,171,37,0.12), transparent 28%), linear-gradient(180deg, #fbf4e8 0%, #f7eddc 100%)",
      }}
    >
      {children}
    </div>
  )
}

export function Panel({
  children,
  className = "",
  tone = "default",
  style,
}: {
  children: ReactNode
  className?: string
  tone?: "default" | "soft" | "warm" | "cool"
  style?: CSSProperties
}) {
  const tones = {
    default: "bg-gradient-to-b from-[#fff5ea] to-[#fffaf3] border-[#e9d8bd]",
    soft: "bg-gradient-to-b from-[#edf7fb] to-[#fffdf8] border-[#cfe5e8]",
    warm: "bg-gradient-to-b from-[#fff0d6] to-[#fffdf6] border-[#f0d9aa]",
    cool: "bg-gradient-to-b from-[#edf7f1] to-[#fffdf8] border-[#cfe5e0]",
  }[tone]

  return (
    <div
      className={cn(
        "rounded-[28px] border shadow-[0_14px_34px_rgba(56,34,14,0.055)]",
        tones,
        className,
      )}
      style={style}
    >
      {children}
    </div>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#8b6f46]">
      {children}
    </p>
  )
}

export function PageTitle({
  eyebrow,
  title,
  subtitle,
  align = "left",
}: {
  eyebrow?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  align?: "left" | "center"
}) {
  return (
    <div className={align === "center" ? "text-center" : "text-left"}>
      {eyebrow && (
        <div className="mb-2 flex items-center gap-2">
          <p className="text-[13px] font-bold text-[#d96d20]">{eyebrow}</p>
          <span className="h-1.5 w-1.5 rounded-full bg-[#d96d20]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#3b8f9f]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#e3ab25]" />
        </div>
      )}
      <h1 className="font-heading text-[clamp(1.95rem,5.4vw,3.15rem)] leading-[0.98] font-semibold tracking-[-0.045em] text-[#2c2418]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-3 max-w-lg text-[14px] leading-[1.55] text-[#6e5d4a]">
          {subtitle}
        </p>
      )}
    </div>
  )
}

export function IconButton({
  children,
  label,
  onClick,
  className = "",
  tone = "default",
}: {
  children: ReactNode
  label: string
  onClick?: () => void
  className?: string
  tone?: "default" | "soft" | "bright"
}) {
  const toneClass = {
    default: "bg-[#fff8ee] text-[#2c2418] border-[#e6d5ba]",
    soft: "bg-[#fff3dd] text-[#2c2418] border-[#f0d9aa]",
    bright: "bg-[#d96d20] text-white border-[#d96d20]",
  }[tone]

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-xl border shadow-[0_8px_20px_rgba(58,36,14,0.08)] transition-transform active:translate-y-[1px]",
        toneClass,
        className,
      )}
    >
      {children}
    </button>
  )
}

export function ProgressRing({
  value,
  max,
  label,
  color,
  size = 108,
  stroke = 8,
  muted = "#efe3ce",
  caption,
}: {
  value: number
  max: number
  label: ReactNode
  color: string
  size?: number
  stroke?: number
  muted?: string
  caption?: ReactNode
}) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(Math.max(value / max, 0), 1)
  const offset = circumference * (1 - progress)

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="absolute inset-0 -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={muted}
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.45s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[24px] font-black leading-none text-[#2c2418]">
            {label}
          </div>
          {caption && (
            <div className="mt-1 text-[11px] font-semibold text-[#8b6f46]">
              {caption}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function StatTile({
  title,
  value,
  subtext,
  color,
  icon,
}: {
  title: string
  value: ReactNode
  subtext: ReactNode
  color: string
  icon: ReactNode
}) {
  return (
    <div
      className="flex min-h-[118px] flex-col justify-between rounded-[22px] border p-2 text-center shadow-[0_12px_24px_rgba(56,34,14,0.08)]"
      style={{
        background: color,
        borderColor: color,
      }}
    >
      <div className="flex flex-col items-center gap-1.5">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-2xl border border-white/25 bg-white/16 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]"
          style={{ color: "white" }}
        >
          {icon}
        </div>
        <div className="pt-0.5">
          <div className="text-[20px] font-black leading-none text-white">
            {value}
          </div>
          <div className="mt-0.5 text-[10px] text-white/85">{subtext}</div>
        </div>
      </div>
      <div className="pt-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white/95">
        {title}
      </div>
    </div>
  )
}

export function ActionTile({
  title,
  subtitle,
  onClick,
  color,
  icon,
}: {
  title: string
  subtitle: string
  onClick?: () => void
  color: string
  icon: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center justify-between gap-3 rounded-[24px] border border-transparent px-4 py-3.5 text-left shadow-[0_14px_35px_rgba(56,34,14,0.075)] transition-transform active:translate-y-[1px]"
      style={{
        background: `linear-gradient(135deg, ${color}, ${color}dd)`,
      }}
    >
      <div className="flex items-center gap-3.5">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/26 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
          {icon}
        </div>
        <div>
          <div className="text-[15px] font-extrabold leading-tight text-white">
            {title}
          </div>
          <div className="mt-1 text-[13px] font-medium text-white/88">
            {subtitle}
          </div>
        </div>
      </div>
      <ArrowRightIcon className="h-4 w-4 text-white/90" />
    </button>
  )
}

export function MiniIconBadge({
  color,
  children,
}: {
  color: string
  children: ReactNode
}) {
  return (
    <div
      className="flex h-12 w-12 items-center justify-center rounded-full border border-[#f4e1c0] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]"
      style={{ background: `linear-gradient(180deg, ${color}22, #fff8ee)` }}
    >
      {children}
    </div>
  )
}

export function IconShell({
  children,
  color,
}: {
  children: ReactNode
  color: string
}) {
  return (
    <span
      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]"
      style={{ background: `linear-gradient(180deg, ${color}22, #fff8ee)` }}
    >
      {children}
    </span>
  )
}

function iconFactory(path: ReactNode, viewBox = "0 0 24 24") {
  return function Icon(props: SVGProps<SVGSVGElement>) {
    return (
      <svg
        viewBox={viewBox}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        {path}
      </svg>
    )
  }
}

export const BarsIcon = iconFactory(<path d="M4 6h16M4 12h16M4 18h16" />)
export const BellIcon = iconFactory(
  <>
    <path d="M15 17H5l1.5-2.2c.7-1 .9-2.2.9-3.4V9a4.6 4.6 0 0 1 9.2 0v2.4c0 1.2.2 2.4.9 3.4L19 17h-4" />
    <path d="M9 17a3 3 0 0 0 6 0" />
  </>,
)
export const ArrowRightIcon = iconFactory(<path d="M5 12h14M13 6l6 6-6 6" />)
export const ChevronLeftIcon = iconFactory(<path d="M14 6 8 12l6 6" />)
export const ChevronRightIcon = iconFactory(<path d="M10 6l6 6-6 6" />)
export const CheckIcon = iconFactory(<path d="M20 6 9 17l-5-5" />)
export const LeafIcon = iconFactory(
  <>
    <path d="M19 5c-6 0-12 4-12 11 0 2.8 2.1 5 5 5 7 0 11-6 11-12 0-1-.2-2-.4-3-1-.2-2-.4-3-.4Z" />
    <path d="M7 18c3-1 6-4 9-9" />
  </>,
)
export const WaterIcon = iconFactory(
  <>
    <path d="M12 3c3 4 6 7.3 6 11a6 6 0 0 1-12 0c0-3.7 3-7 6-11Z" />
  </>,
)
export const FlameIcon = iconFactory(
  <path d="M13 3c1.2 2.4.5 4.1-.5 5.4-.9 1.2-1.7 1.9-1.7 3.2 0 1.8 1.4 3 3.2 3 2.4 0 4-1.9 4-4.6 0-3.6-2.7-6.1-5-7Z" />,
)
export const ActivityIcon = iconFactory(<path d="M4 14h4l2-6 3 12 2-8h5" />)
export const ScaleIcon = iconFactory(
  <>
    <path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z" />
    <path d="M12 12l3-3" />
    <path d="M9 12h6" />
  </>,
)
export const HomeIcon = iconFactory(<path d="M4 11.5 12 5l8 6.5V20H4z" />)
export const ProgressIcon = iconFactory(<path d="M5 19V9M12 19V5M19 19v-8" />)
export const GardenIcon = iconFactory(
  <>
    <path d="M12 20V10" />
    <path d="M12 10c-4 0-7-2.8-7-6 3.6 0 7 1.7 7 6Z" />
    <path d="M12 10c4 0 7-2.8 7-6-3.6 0-7 1.7-7 6Z" />
  </>,
)
export const CoachIcon = iconFactory(
  <>
    <path d="M5 17l2.3-1.1a6 6 0 0 1 2.7-.6h4.8a4.2 4.2 0 0 0 4.2-4.2V8.4A4.4 4.4 0 0 0 14.6 4H9.4A4.4 4.4 0 0 0 5 8.4V17Z" />
    <path d="M8 10h8M8 13h5" />
  </>,
)
export const ProfileIcon = iconFactory(
  <>
    <path d="M12 12.2a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </>,
)
