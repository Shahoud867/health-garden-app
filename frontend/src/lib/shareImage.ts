import type { Lang, PlantState } from "../types"
import { CYCLE_LENGTH } from "../types"

/**
 * Renders a shareable image of the current garden state entirely on
 * `<canvas>` — deliberately not composited from the real plant/theme
 * artwork under `public/plants/*`, since those files are still missing
 * their actual binary content upstream (Git LFS pointers with nothing
 * uploaded to back them — a pre-existing gap, not something fixable from
 * here). Drawing simple shapes instead means this works today, and keeps
 * working unmodified once that art is restored — it was never a
 * workaround, just the simpler and more portable choice: no image loads
 * to fail, no cross-origin canvas tainting to worry about.
 */

const PLANT_COLOR: Record<PlantState["type"], string> = {
  cactus: "#d96d20",
  sunflower: "#6c9e36",
  bellflower: "#3b8f9f",
  bamboo: "#dca11b",
  succulent: "#7c7d4b",
}

const WIDTH = 1200
const HEIGHT = 630

export interface ShareImageOptions {
  garden: PlantState[]
  displayName: string
  lang: Lang
}

export async function renderGardenShareImage({
  garden,
  displayName,
  lang,
}: ShareImageOptions): Promise<Blob> {
  const canvas = document.createElement("canvas")
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Could not create the share image on this device.")
  }

  const bg = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT)
  bg.addColorStop(0, "#fbf4e8")
  bg.addColorStop(1, "#f7eddc")
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  ctx.textBaseline = "alphabetic"
  ctx.textAlign = "left"
  ctx.fillStyle = "#241f15"
  ctx.font = "700 52px system-ui, -apple-system, sans-serif"
  const heading =
    lang === "ur"
      ? `${displayName || "میرا"} کا صحت باغیچہ`
      : `${displayName ? `${displayName}’s` : "My"} Health Garden`
  ctx.fillText(heading, 64, 96)

  ctx.fillStyle = "#6e5d4a"
  ctx.font = "400 24px system-ui, -apple-system, sans-serif"
  ctx.fillText(
    lang === "ur"
      ? "ہر اچھا انتخاب اسے بڑھاتا ہے — کبھی نہیں مٹتا۔"
      : "Every good choice grows it — it never resets.",
    64,
    136,
  )

  const plants = garden.slice(0, 5)
  const tileW = WIDTH / Math.max(plants.length, 1)
  const cy = 330

  plants.forEach((plant, i) => {
    const cx = tileW * i + tileW / 2
    const progress = plant.cycleDays / CYCLE_LENGTH
    const color = PLANT_COLOR[plant.type]

    // Progress ring
    ctx.beginPath()
    ctx.arc(cx, cy, 72, 0, Math.PI * 2)
    ctx.strokeStyle = "#eadcc7"
    ctx.lineWidth = 10
    ctx.stroke()

    if (progress > 0) {
      ctx.beginPath()
      ctx.arc(cx, cy, 72, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress)
      ctx.strokeStyle = color
      ctx.lineWidth = 10
      ctx.lineCap = "round"
      ctx.stroke()
      ctx.lineCap = "butt"
    }

    // Sprout glyph: bud + stem, same motif as the app's own icon set
    ctx.beginPath()
    ctx.arc(cx, cy - 10, 24, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    ctx.fillRect(cx - 6, cy - 6, 12, 34)

    if (plant.metToday) {
      ctx.beginPath()
      ctx.arc(cx + 54, cy - 54, 16, 0, Math.PI * 2)
      ctx.fillStyle = "#6c9e36"
      ctx.fill()
      ctx.strokeStyle = "#fff8ee"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(cx + 47, cy - 54)
      ctx.lineTo(cx + 52, cy - 49)
      ctx.lineTo(cx + 61, cy - 61)
      ctx.stroke()
    }

    ctx.fillStyle = "#241f15"
    ctx.font = "700 19px system-ui, -apple-system, sans-serif"
    ctx.textAlign = "center"
    ctx.fillText(lang === "ur" ? plant.goalUr : plant.goal, cx, cy + 108)
    ctx.textAlign = "left"
  })

  ctx.fillStyle = "#8b6f46"
  ctx.font = "400 20px system-ui, -apple-system, sans-serif"
  ctx.fillText(lang === "ur" ? "ہیلتھ گارڈن" : "Health Garden", 64, HEIGHT - 48)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error("Could not generate the share image."))
    }, "image/png")
  })
}
