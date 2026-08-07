import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import type { Session } from "@supabase/supabase-js"
import { getSession, onAuthStateChange } from "../lib/api/auth"

interface AuthContextValue {
  /** Null until the initial session check resolves; see `loading`. */
  session: Session | null
  /** True only during the very first session resolution on app boot. */
  loading: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/**
 * Resolves the persisted Supabase session once on boot (from `localStorage`
 * — see `lib/supabase.ts`'s `persistSession: true`) and then stays in sync
 * via `onAuthStateChange` for the lifetime of the app: every screen that
 * calls `useAuth()` re-renders automatically on sign-in/sign-out/token
 * refresh, with no manual event wiring per screen.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    getSession()
      .then((s) => {
        if (active) {
          setSession(s)
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) setLoading(false)
      })

    const unsubscribe = onAuthStateChange((s) => {
      if (active) setSession(s)
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
