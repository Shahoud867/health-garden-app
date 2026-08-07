/** Small inline spinner for buttons/inline states — pairs with `disabled`. */
export function Spinner({
  size = 18,
  color = "currentColor",
}: {
  size?: number
  color?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
      role="status"
      aria-label="Loading"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke={color}
        strokeWidth="2.5"
        opacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** A soft pulsing block standing in for content still loading — matches Panel's rounded warm palette. */
export function Skeleton({
  className = "",
  height = 16,
}: {
  className?: string
  height?: number
}) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-[#eadcc7] ${className}`}
      style={{ height }}
      aria-hidden="true"
    />
  )
}

/** Full-screen boot/route-transition loading state — shown while the auth session or first data fetch resolves. */
export function FullScreenLoading({ label }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <Spinner size={32} color="#6c9e36" />
      {label && <p className="text-sm font-semibold text-[#6e5d4a]">{label}</p>}
    </div>
  )
}
