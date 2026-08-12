import type { Lang } from "../types"
import { Panel } from "./Primitives"
import { Spinner } from "./Loading"

interface Props {
  lang: Lang
  enabling: boolean
  onEnable: () => void
  onDismiss: () => void
}

/** Offered, never forced -- see usePushPrompt's doc comment for when this
 * shows and why. Matches notify-inactive-users' own restrained tone: no
 * exclamation marks, no streak-guilt framing, an honest "if you want it." */
export default function PushPromptBanner({
  lang,
  enabling,
  onEnable,
  onDismiss,
}: Props) {
  return (
    <Panel tone="cool" className="mb-4 flex items-center gap-3 p-4">
      <div className="flex-1">
        <p className="text-[13px] font-bold text-[#241f15]">
          {lang === "ur"
            ? "دن چھوٹ جائے تو ایک نرم یاد دہانی چاہیے؟"
            : "Want a gentle reminder if you miss a day?"}
        </p>
        <p className="mt-0.5 text-[11.5px] text-[#6e5d4a]">
          {lang === "ur"
            ? "کبھی شرمندگی نہیں، بس ایک آہستہ اشارہ۔"
            : "Never guilt-trippy — just a quiet nudge, your call."}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={onDismiss}
          disabled={enabling}
          className="rounded-full px-3 py-2 text-[12px] font-bold text-[#6e5d4a] disabled:opacity-60"
        >
          {lang === "ur" ? "ابھی نہیں" : "Not now"}
        </button>
        <button
          onClick={onEnable}
          disabled={enabling}
          className="flex items-center gap-1.5 rounded-full bg-[#3b8f9f] px-4 py-2 text-[12px] font-extrabold text-white disabled:opacity-80"
        >
          {enabling && <Spinner size={13} color="#fff" />}
          {lang === "ur" ? "فعال کریں" : "Enable"}
        </button>
      </div>
    </Panel>
  )
}
