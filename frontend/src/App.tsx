import { useState } from 'react'
import type { Screen, Lang, AppState } from './types'
import BottomNav from './components/BottomNav'
import LandingScreen from './screens/LandingScreen'
import AuthScreen from './screens/AuthScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import HomeScreen from './screens/HomeScreen'
import FoodScreen from './screens/FoodScreen'
import WorkoutScreen from './screens/WorkoutScreen'
import WaterScreen from './screens/WaterScreen'
import WeightScreen from './screens/WeightScreen'
import GardenScreen from './screens/GardenScreen'
import AICoachScreen from './screens/AICoachScreen'
import AIPlanScreen from './screens/AIPlanScreen'
import PremiumScreen from './screens/PremiumScreen'
import PricingScreen from './screens/PricingScreen'
import ProfileScreen from './screens/ProfileScreen'

const INITIAL_STATE: AppState = {
  lang: 'en',
  isPremium: false,
  syncStatus: 'synced',
  onboardingComplete: false,
  isLoggedIn: false,
  user: {
    name: '',
    age: 25,
    sex: 'female',
    heightCm: 165,
    weightKg: 65,
    activityLevel: 'moderate',
    goal: 'general',
    conditions: [],
    calorieTarget: 1800,
    proteinTarget: 104,
  },
  today: {
    caloriesLogged: 480,
    waterGlasses: 3,
    workoutMinutes: 0,
    foodEntries: [
      { id: '1', name: 'Paratha', nameUr: 'پراٹھا', slot: 'breakfast', unit: 'piece', qty: 2, calories: 520, protein: 12 },
    ],
    workoutEntries: [],
    weightLog: null,
  },
  garden: [
    { type: 'cactus',     goal: 'Sugar-free days', goalUr: 'شکر سے پاک دن', daysThisWeek: 4, metToday: true  },
    { type: 'sunflower',  goal: 'Movement',         goalUr: 'ورزش',           daysThisWeek: 2, metToday: false },
    { type: 'bellflower', goal: 'Hydration',         goalUr: 'پانی',           daysThisWeek: 5, metToday: true  },
    { type: 'bamboo',     goal: 'Protein',           goalUr: 'پروٹین',         daysThisWeek: 3, metToday: false },
    { type: 'succulent',  goal: 'Consistency',       goalUr: 'مستقل مزاجی',   daysThisWeek: 6, metToday: true  },
  ],
  weightHistory: [
    { date: '2025-06-01', weight: 67.2 },
    { date: '2025-06-08', weight: 66.8 },
    { date: '2025-06-15', weight: 66.1 },
    { date: '2025-06-22', weight: 65.6 },
    { date: '2025-06-29', weight: 65.2 },
  ],
  aiChat: {
    messages: [],
    usedToday: 0,
    dailyCap: 15,
    enabled: true,
  },
  aiPlan: {
    plan: null,
    regenUsed: 0,
    regenCap: 2,
  },
}

const AUTH_SCREENS: Screen[] = ['landing', 'login', 'signup', 'forgot-password', 'email-verify', 'pricing']
const APP_SCREENS: Screen[] = ['home', 'food', 'workout', 'water', 'weight', 'garden', 'garden-history', 'ai-coach', 'ai-plan', 'premium', 'profile']

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing')
  const [state, setStateRaw] = useState<AppState>(INITIAL_STATE)

  const setState = (patch: Partial<AppState>) => setStateRaw(prev => ({ ...prev, ...patch }))

  const navigate = (s: Screen) => setScreen(s)

  const { lang } = state

  const setLang = (l: Lang) => {
    setState({ lang: l })
    document.documentElement.dir = l === 'ur' ? 'rtl' : 'ltr'
    document.documentElement.lang = l
  }

  const isLoggedIn = state.isLoggedIn
  const onboardingComplete = state.onboardingComplete
  const isPremium = state.isPremium
  const showNav = isLoggedIn && onboardingComplete && APP_SCREENS.includes(screen)

  const navProps = {
    navigate,
    currentScreen: screen,
    lang,
    setLang,
    isPremium,
    syncStatus: state.syncStatus,
  }

  const onAuth = () => {
    setState({ isLoggedIn: true })
    navigate('onboarding')
  }

  const onOnboardingComplete = (user: AppState['user']) => {
    setState({ user, onboardingComplete: true })
    navigate('home')
  }

  const onLogout = () => {
    setStateRaw(INITIAL_STATE)
    navigate('landing')
  }

  const renderScreen = () => {
    // Guard: must be logged in for app screens
    if (!isLoggedIn && APP_SCREENS.includes(screen)) {
      navigate('login')
      return null
    }
    // Guard: must complete onboarding
    if (isLoggedIn && !onboardingComplete && screen !== 'onboarding') {
      return <OnboardingScreen {...navProps} onComplete={onOnboardingComplete}/>
    }

    switch (screen) {
      case 'landing':
        return <LandingScreen {...navProps}/>

      case 'pricing':
        return <PricingScreen {...navProps}/>

      case 'login':
        return <AuthScreen {...navProps} mode="login" onAuth={onAuth}/>

      case 'signup':
        return <AuthScreen {...navProps} mode="signup" onAuth={onAuth}/>

      case 'forgot-password':
        return <AuthScreen {...navProps} mode="forgot-password" onAuth={onAuth}/>

      case 'email-verify':
        return <AuthScreen {...navProps} mode="email-verify" onAuth={onAuth}/>

      case 'onboarding':
        return <OnboardingScreen {...navProps} onComplete={onOnboardingComplete}/>

      case 'home':
        return <HomeScreen {...navProps} state={state} setState={setState}/>

      case 'food':
        return <FoodScreen {...navProps} state={state} setState={setState}/>

      case 'workout':
        return <WorkoutScreen {...navProps} state={state} setState={setState}/>

      case 'water':
        return <WaterScreen {...navProps} state={state} setState={setState}/>

      case 'weight':
        return <WeightScreen {...navProps} state={state} setState={setState}/>

      case 'garden':
      case 'garden-history':
        return <GardenScreen {...navProps} state={state}/>

      case 'ai-coach':
        return <AICoachScreen {...navProps} state={state} setState={setState}/>

      case 'ai-plan':
        return <AIPlanScreen {...navProps} state={state} setState={setState}/>

      case 'premium':
        return <PremiumScreen {...navProps} onUpgrade={() => setState({ isPremium: true })}/>

      case 'profile':
        return <ProfileScreen {...navProps} state={state} setState={setState} onLogout={onLogout}/>

      default:
        return <LandingScreen {...navProps}/>
    }
  }

  return (
    <div
      dir={lang === 'ur' ? 'rtl' : 'ltr'}
      lang={lang}
      className="app-noise"
      style={{
        minHeight: '100vh',
        maxWidth: 430,
        margin: '0 auto',
        background:
          'radial-gradient(circle at 12% 10%, rgba(217,109,32,0.10), transparent 28%), radial-gradient(circle at 84% 18%, rgba(59,143,159,0.10), transparent 26%), radial-gradient(circle at 72% 88%, rgba(227,171,37,0.12), transparent 28%), linear-gradient(180deg, #fbf6ea 0%, #f7edd9 100%)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 0 60px rgba(58,36,18,0.07)',
        borderLeft: '1px solid rgba(232,216,188,0.55)',
        borderRight: '1px solid rgba(232,216,188,0.55)',
        fontFamily: lang === 'ur' ? "'Noto Nastaliq Urdu', 'Nunito', serif" : "'Nunito', sans-serif",
      }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-20 h-56 w-56 rounded-full bg-[#d96d20]/10 blur-3xl" />
        <div className="absolute top-[18%] -right-24 h-64 w-64 rounded-full bg-[#3b8f9f]/10 blur-3xl" />
        <div className="absolute -bottom-28 left-10 h-72 w-72 rounded-full bg-[#e3ab25]/12 blur-3xl" />
      </div>
      <div className="relative z-10">
      {renderScreen()}
      {showNav && (
        <BottomNav {...navProps}/>
      )}
      </div>
    </div>
  )
}
