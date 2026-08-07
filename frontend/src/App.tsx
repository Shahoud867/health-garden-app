import { useEffect, useState } from "react"
import type { Screen, Lang } from "./types"
import { AuthProvider, useAuth } from "./hooks/useAuth"
import { ToastProvider, useToast } from "./hooks/useToast"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { FullScreenLoading } from "./components/Loading"
import { useAppData } from "./hooks/useAppData"
import { signOut } from "./lib/api/auth"
import { updateProfile } from "./lib/api/profile"
import type { Goal } from "./lib/database.types"
import BottomNav from "./components/BottomNav"
import LandingScreen from "./screens/LandingScreen"
import AuthScreen from "./screens/AuthScreen"
import OnboardingScreen from "./screens/OnboardingScreen"
import HomeScreen from "./screens/HomeScreen"
import FoodScreen from "./screens/FoodScreen"
import WorkoutScreen from "./screens/WorkoutScreen"
import WaterScreen from "./screens/WaterScreen"
import WeightScreen from "./screens/WeightScreen"
import GardenScreen from "./screens/GardenScreen"
import AICoachScreen from "./screens/AICoachScreen"
import AIPlanScreen from "./screens/AIPlanScreen"
import PremiumScreen from "./screens/PremiumScreen"
import PricingScreen from "./screens/PricingScreen"
import ProfileScreen from "./screens/ProfileScreen"
import LegalScreen from "./screens/LegalScreen"
import type { AppState } from "./types"

const AUTH_SCREENS: Screen[] = [
  "landing",
  "login",
  "signup",
  "forgot-password",
  "email-verify",
  "pricing",
]
const APP_SCREENS: Screen[] = [
  "home",
  "food",
  "workout",
  "water",
  "weight",
  "garden",
  "garden-history",
  "ai-coach",
  "ai-plan",
  "premium",
  "profile",
]

function AppShell() {
  const { session, loading: authLoading } = useAuth()
  const {
    state: data,
    setState: setData,
    profile,
    loading: dataLoading,
    loadError,
    refetch,
  } = useAppData(session)
  // The id every logging table's user_id actually references (users.id) --
  // distinct from session.user.id (auth.users.id / auth_id). Passing the
  // wrong one silently breaks RLS-scoped inserts, so this is the single
  // source every screen reads from, never session.user.id directly.
  const userId = profile?.id ?? ""
  const { showToast } = useToast()
  const [screen, setScreen] = useState<Screen>("landing")
  const [lang, setLangRaw] = useState<Lang>("en")

  const navigate = (s: Screen) => setScreen(s)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [screen])

  // Real signal, not decorative: every write in this app is an awaited
  // round trip (no offline queue exists yet -- see README's "Remaining
  // work"), so "pending" never applies here. "Offline" reflects the
  // browser's actual connectivity; a write attempted while offline still
  // surfaces its own error toast from the screen that made it.
  useEffect(() => {
    const goOnline = () => setData({ syncStatus: "synced" })
    const goOffline = () => setData({ syncStatus: "offline" })
    window.addEventListener("online", goOnline)
    window.addEventListener("offline", goOffline)
    if (!navigator.onLine) goOffline()
    return () => {
      window.removeEventListener("online", goOnline)
      window.removeEventListener("offline", goOffline)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reactive redirect once a session resolves (login/signup succeeded, or a
  // persisted session was restored on boot) -- screens call the real auth
  // API directly and never navigate themselves on success; this is the one
  // place that decides where a freshly-authenticated user lands.
  useEffect(() => {
    if (authLoading || dataLoading) return
    if (data.isLoggedIn && AUTH_SCREENS.includes(screen)) {
      navigate(data.onboardingComplete ? "home" : "onboarding")
    }
    if (!data.isLoggedIn && APP_SCREENS.includes(screen)) {
      navigate("landing")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run on
    // the values that should trigger a redirect, not on every `screen` change
    // this effect itself causes.
  }, [data.isLoggedIn, data.onboardingComplete, authLoading, dataLoading])

  useEffect(() => {
    if (loadError) showToast(loadError, "error")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadError])

  const setLang = (l: Lang) => {
    setLangRaw(l)
    document.documentElement.dir = l === "ur" ? "rtl" : "ltr"
    document.documentElement.lang = l
  }

  const isLoggedIn = data.isLoggedIn
  const onboardingComplete = data.onboardingComplete
  const isPremium = data.isPremium
  const showNav =
    isLoggedIn && onboardingComplete && APP_SCREENS.includes(screen)

  const navProps = {
    navigate,
    currentScreen: screen,
    lang,
    setLang,
    isPremium,
    syncStatus: data.syncStatus,
  }

  const onOnboardingComplete = async (user: AppState["user"]) => {
    if (!session) return
    try {
      await updateProfile(session.user.id, {
        full_name: user.name,
        age: user.age,
        sex: user.sex,
        height_cm: user.heightCm,
        weight_kg: user.weightKg,
        activity_level: user.activityLevel,
        // OnboardingScreen only ever assigns one of users.goal's five valid
        // CHECK values (0003_users.sql) -- AppState.user.goal is a bare
        // `string` for backward-compat with the pre-integration mock, so
        // this narrows to the real column type.
        goal: user.goal as Goal,
        conditions: user.conditions.join(","),
        daily_calorie_target: user.calorieTarget,
        daily_protein_target_g: user.proteinTarget,
      })
      await refetch()
      navigate("home")
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Could not save your profile.",
        "error",
      )
    }
  }

  const onLogout = async () => {
    try {
      await signOut()
    } catch {
      // Sign-out failing client-side (e.g. offline) shouldn't trap the user
      // on the profile screen -- the local session is cleared either way
      // once onAuthStateChange fires, so proceed to the landing screen.
    }
    navigate("landing")
  }

  // First-ever boot only: the persisted-session check hasn't resolved yet,
  // so we don't know if this is a logged-in user or a fresh visitor. Once
  // resolved, per-screen loading (skeletons) takes over instead of a
  // full-screen blocker on every subsequent data refresh.
  if (authLoading) {
    return <FullScreenLoading />
  }

  const renderScreen = () => {
    if (!isLoggedIn && APP_SCREENS.includes(screen)) {
      return null // the redirect effect above handles navigation
    }
    if (isLoggedIn && dataLoading && screen !== "onboarding") {
      return <FullScreenLoading />
    }
    if (
      isLoggedIn &&
      !onboardingComplete &&
      screen !== "onboarding" &&
      APP_SCREENS.includes(screen)
    ) {
      return (
        <OnboardingScreen {...navProps} onComplete={onOnboardingComplete} />
      )
    }

    switch (screen) {
      case "landing":
        return <LandingScreen {...navProps} />

      case "pricing":
        return <PricingScreen {...navProps} />

      case "login":
        return <AuthScreen {...navProps} mode="login" onAuth={() => {}} />

      case "signup":
        return <AuthScreen {...navProps} mode="signup" onAuth={() => {}} />

      case "forgot-password":
        return (
          <AuthScreen {...navProps} mode="forgot-password" onAuth={() => {}} />
        )

      case "email-verify":
        return (
          <AuthScreen {...navProps} mode="email-verify" onAuth={() => {}} />
        )

      case "onboarding":
        return (
          <OnboardingScreen {...navProps} onComplete={onOnboardingComplete} />
        )

      case "home":
        return <HomeScreen {...navProps} state={data} setState={setData} />

      case "food":
        return (
          <FoodScreen
            {...navProps}
            state={data}
            setState={setData}
            userId={userId}
            refetch={refetch}
          />
        )

      case "workout":
        return (
          <WorkoutScreen
            {...navProps}
            state={data}
            setState={setData}
            userId={userId}
            refetch={refetch}
          />
        )

      case "water":
        return (
          <WaterScreen
            {...navProps}
            state={data}
            setState={setData}
            userId={userId}
            refetch={refetch}
          />
        )

      case "weight":
        return (
          <WeightScreen
            {...navProps}
            state={data}
            setState={setData}
            userId={userId}
            refetch={refetch}
          />
        )

      case "garden":
      case "garden-history":
        return <GardenScreen {...navProps} state={data} userId={userId} />

      case "ai-coach":
        return <AICoachScreen {...navProps} state={data} setState={setData} />

      case "ai-plan":
        return (
          <AIPlanScreen
            {...navProps}
            state={data}
            setState={setData}
            userId={userId}
          />
        )

      case "premium":
        return (
          <PremiumScreen
            {...navProps}
            onUpgrade={() => refetch()}
            userId={userId}
          />
        )

      case "profile":
        return (
          <ProfileScreen
            {...navProps}
            state={data}
            setState={setData}
            onLogout={onLogout}
            authId={session?.user.id ?? ""}
          />
        )

      case "privacy":
      case "terms":
      case "about":
        return (
          <LegalScreen
            {...navProps}
            doc={screen}
            backTo={isLoggedIn ? "profile" : "landing"}
          />
        )

      default:
        return <LandingScreen {...navProps} />
    }
  }

  return (
    <div
      dir={lang === "ur" ? "rtl" : "ltr"}
      lang={lang}
      className="app-noise"
      style={{
        minHeight: "100vh",
        maxWidth: 430,
        margin: "0 auto",
        background:
          "radial-gradient(circle at 12% 10%, rgba(217,109,32,0.10), transparent 28%), radial-gradient(circle at 84% 18%, rgba(59,143,159,0.10), transparent 26%), radial-gradient(circle at 72% 88%, rgba(227,171,37,0.12), transparent 28%), linear-gradient(180deg, #fbf6ea 0%, #f7edd9 100%)",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 0 60px rgba(58,36,18,0.07)",
        borderLeft: "1px solid rgba(232,216,188,0.55)",
        borderRight: "1px solid rgba(232,216,188,0.55)",
        fontFamily:
          lang === "ur"
            ? "'Noto Nastaliq Urdu', 'Nunito', serif"
            : "'Nunito', sans-serif",
      }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-20 h-56 w-56 rounded-full bg-[#d96d20]/10 blur-3xl" />
        <div className="absolute top-[18%] -right-24 h-64 w-64 rounded-full bg-[#3b8f9f]/10 blur-3xl" />
        <div className="absolute -bottom-28 left-10 h-72 w-72 rounded-full bg-[#e3ab25]/12 blur-3xl" />
      </div>
      <div className="relative z-10">
        {renderScreen()}
        {showNav && <BottomNav {...navProps} />}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}
