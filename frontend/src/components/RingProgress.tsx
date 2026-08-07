interface RingProgressProps {
  value: number
  max: number
  size?: number
  stroke?: number
  color?: string
  bg?: string
  label?: string
  sublabel?: string
}

export default function RingProgress({
  value,
  max,
  size = 80,
  stroke = 7,
  color = "#5E8A2A",
  bg = "#CEBFA6",
  label,
  sublabel,
}: RingProgressProps) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(value / max, 1)
  const dash = pct * circ

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        style={{
          transform: "rotate(-90deg)",
          position: "absolute",
          top: 0,
          left: 0,
        }}
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={bg}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      {label && (
        <div className="text-center relative z-10">
          <div
            className="font-700 text-sm leading-none"
            style={{ color: "#3A342A", fontFamily: "'Nunito', sans-serif" }}
          >
            {label}
          </div>
          {sublabel && (
            <div
              className="text-[10px] mt-0.5"
              style={{ color: "#7A6E62", fontFamily: "'Nunito', sans-serif" }}
            >
              {sublabel}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
