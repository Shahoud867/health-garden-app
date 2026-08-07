import type { SyncStatus, Lang } from "../types"
import { t } from "../types"

export default function SyncBadge({
  status,
  lang,
}: {
  status: SyncStatus
  lang: Lang
}) {
  const cfg = {
    synced: {
      dot: "#6c9e36",
      label: t("synced", lang),
      bg: "#eef6e1",
      border: "#d9e8bb",
      ink: "#567a2d",
    },
    pending: {
      dot: "#e3ab25",
      label: t("syncPending", lang),
      bg: "#fff0cf",
      border: "#f1dca1",
      ink: "#8e641c",
    },
    offline: {
      dot: "#8b7b67",
      label: t("offline", lang),
      bg: "#f3ebe0",
      border: "#e5d8c7",
      ink: "#77624b",
    },
  }[status]

  return (
    <div
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold shadow-[0_8px_18px_rgba(58,36,18,0.04)]"
      style={{
        background: cfg.bg,
        borderColor: cfg.border,
        color: cfg.ink,
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{
          background: cfg.dot,
          animation:
            status === "pending" ? "pulse-soft 2s infinite" : undefined,
        }}
      />
      <span>{cfg.label}</span>
    </div>
  )
}
