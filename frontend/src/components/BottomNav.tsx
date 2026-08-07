import type { NavProps, Screen } from "../types"
import { t } from "../types"
import {
  HomeIcon,
  ProgressIcon,
  GardenIcon,
  CoachIcon,
  ProfileIcon,
} from "./Primitives"

interface Tab {
  screen: Screen
  labelKey: Parameters<typeof t>[0]
  icon: React.ReactNode
  activeScreens?: Screen[]
  accent: string
}

const TABS: Tab[] = [
  {
    screen: "home",
    labelKey: "home",
    icon: <HomeIcon className="h-[18px] w-[18px]" />,
    activeScreens: ["home"],
    accent: "#d96d20",
  },
  {
    screen: "food",
    labelKey: "food",
    icon: <ProgressIcon className="h-[18px] w-[18px]" />,
    activeScreens: ["food", "water", "workout", "weight"],
    accent: "#3b8f9f",
  },
  {
    screen: "garden",
    labelKey: "garden",
    icon: <GardenIcon className="h-[18px] w-[18px]" />,
    activeScreens: ["garden", "garden-history"],
    accent: "#e3ab25",
  },
  {
    screen: "ai-coach",
    labelKey: "coach",
    icon: <CoachIcon className="h-[18px] w-[18px]" />,
    activeScreens: ["ai-coach", "ai-plan"],
    accent: "#6c9e36",
  },
  {
    screen: "profile",
    labelKey: "profile",
    icon: <ProfileIcon className="h-[18px] w-[18px]" />,
    activeScreens: ["profile"],
    accent: "#d96d20",
  },
]

export default function BottomNav({ navigate, currentScreen, lang }: NavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#ebdcc4] bg-[#fff7ea]/92 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Main navigation"
    >
      <div className="mx-auto grid max-w-[430px] grid-cols-5 px-3 py-1.5">
        {TABS.map((tab) => {
          const isActive =
            tab.activeScreens?.includes(currentScreen) ||
            currentScreen === tab.screen
          return (
            <button
              key={tab.screen}
              type="button"
              onClick={() => navigate(tab.screen)}
              className="flex flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 text-center transition-transform active:translate-y-[1px]"
              style={{
                color: isActive ? tab.accent : "#7b6851",
                background: isActive
                  ? `linear-gradient(180deg, ${tab.accent}18, rgba(255,255,255,0.65))`
                  : "transparent",
              }}
              aria-current={isActive ? "page" : undefined}
              aria-label={t(tab.labelKey, lang)}
            >
              <span className={isActive ? "scale-105" : ""}>{tab.icon}</span>
              <span className="text-[9.5px] font-extrabold tracking-[0.06em]">
                {t(tab.labelKey, lang)}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
