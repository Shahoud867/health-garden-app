import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react"

export type ToastTone = "success" | "error" | "info"

interface Toast {
  id: number
  message: string
  tone: ToastTone
}

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

const TONE_STYLES: Record<ToastTone, {
  background: string
  border: string
  icon: string
}> = {
  success: { background: "#eef6e2", border: "#b9d99a", icon: "✓" },
  error: { background: "#fdeeea", border: "#f0b8a8", icon: "!" },
  info: { background: "#eaf4f6", border: "#a9d3da", icon: "i" },
}

const AUTO_DISMISS_MS = 4500

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, tone: ToastTone = "info") => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, tone }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, AUTO_DISMISS_MS)
  }, [])

  const dismiss = (id: number) =>
    setToasts((prev) => prev.filter((toast) => toast.id !== id))

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* aria-live region: screen readers announce each toast as it lands,
          without moving keyboard focus off whatever the user was doing. */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((toast) => {
          const style = TONE_STYLES[toast.tone]
          return (
            <button
              key={toast.id}
              type="button"
              onClick={() => dismiss(toast.id)}
              className="pointer-events-auto flex w-full max-w-[400px] items-center gap-3 rounded-2xl border px-4 py-3 text-left shadow-[0_14px_34px_rgba(56,34,14,0.14)] transition-transform active:scale-[0.99]"
              style={{
                background: style.background,
                borderColor: style.border,
              }}
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
                style={{
                  background:
                    toast.tone === "error"
                      ? "#c85a3d"
                      : toast.tone === "success"
                        ? "#6c9e36"
                        : "#3b8f9f",
                }}
              >
                {style.icon}
              </span>
              <span className="text-[13px] font-semibold leading-snug text-[#2c2418]">
                {toast.message}
              </span>
            </button>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within a ToastProvider")
  return ctx
}
