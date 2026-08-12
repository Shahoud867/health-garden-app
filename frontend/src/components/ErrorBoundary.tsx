import { Component, type ReactNode } from "react"
import { reportError } from "../lib/analytics"

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Last line of defense against an unhandled render error taking down the
 * whole app to a blank white screen — catches anything a `try`/`catch` in an
 * event handler can't (render-phase errors, per React's error boundary
 * contract). Screen-level `AppError` handling (toasts, inline messages)
 * should catch everything in normal operation; this exists for the
 * genuinely unexpected case.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    // eslint-disable-next-line no-console -- reportError() below is a
    // best-effort, fire-and-forget network call (a no-op without
    // VITE_SENTRY_DSN configured, per lib/observability/sentry.ts) --
    // console stays as the guaranteed-visible sink either way, exactly
    // like every other error path in this app.
    console.error("Unhandled render error:", error, info.componentStack)
    reportError(error, { componentStack: info.componentStack ?? undefined })
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-4xl">🌱</div>
        <h1 className="font-heading text-2xl font-semibold text-[#2c2418]">
          Something went wrong
        </h1>
        <p className="max-w-sm text-sm leading-6 text-[#6e5d4a]">
          The app hit an unexpected error. Reloading usually fixes it — your
          data is safe either way.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-full bg-[#6c9e36] px-6 py-3 font-extrabold text-white shadow-[0_12px_26px_rgba(108,158,54,0.16)]"
        >
          Reload
        </button>
      </div>
    )
  }
}
