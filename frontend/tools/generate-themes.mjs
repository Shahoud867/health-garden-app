/**
 * Regenerates src/data/gardenThemes.ts from tools/slots.json.
 *
 *   node tools/generate-themes.mjs
 *
 * slots.json is the raw export from tools/marker-picker.html: open it in a
 * browser, load a theme's marker image, click its 25 planting spots in
 * reading order, then export.
 *
 * Field art is expected to already sit at public/themes/<slug>/field.png.
 * This script only writes coordinates -- it does not copy images, so the
 * repository never carries a second copy of the artwork.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(HERE, "..")

/**
 * Per-theme corrections applied on top of the captured coordinates. Kept
 * here rather than edited into the generated file, so re-capturing a theme
 * cannot silently discard them.
 */
const ADJUSTMENTS = {
  // The back row of markers sat on a cast shadow rather than a planting row,
  // pushing the whole grid forward until the front row overlapped the fence.
  "back garden": { yOffset: -3.5 },
}

/**
 * Plant render size as a multiple of the default, for themes whose plot is
 * physically smaller in frame and would otherwise look overcrowded.
 */
const PLANT_SCALE = {
  greenhouse: 0.78,
}

const slug = (n) => n.toLowerCase().replace(/\s+/g, "-")
const title = (n) => n.replace(/\b\w/g, (c) => c.toUpperCase())
const round = (n) => Math.round(n * 100) / 100

const data = JSON.parse(fs.readFileSync(path.join(HERE, "slots.json"), "utf8"))
const entries = []

for (const [name, info] of Object.entries(data)) {
  const s = slug(name)

  if (info.slots.length !== 25) {
    throw new Error(`${name}: expected 25 slots, got ${info.slots.length}`)
  }

  const field = path.join(ROOT, "public", "themes", s, "field.png")
  if (!fs.existsSync(field)) {
    throw new Error(`${name}: no field art at public/themes/${s}/field.png`)
  }

  const adj = ADJUSTMENTS[name] ?? {}
  const slots = info.slots.map((p) => ({
    x: round(p.x + (adj.xOffset ?? 0)),
    y: round(p.y + (adj.yOffset ?? 0)),
  }))

  const scale = PLANT_SCALE[s]
  entries.push(`  {
    slug: '${s}',
    name: '${title(name)}',
    fieldImage: '/themes/${s}/field.png',
    fieldWidth: ${info.width},
    fieldHeight: ${info.height},${scale ? `\n    plantScale: ${scale},` : ""}
    slots: [
${slots.map((p) => `      { x: ${p.x}, y: ${p.y} },`).join("\n")}
    ],
  },`)
}

const out = `// GENERATED FILE -- do not edit by hand.
// Regenerate with: node tools/generate-themes.mjs
// Source data: tools/slots.json (captured via tools/marker-picker.html)

export interface GardenTheme {
  slug: string;
  name: string;
  fieldImage: string;
  fieldWidth: number;
  fieldHeight: number;
  /**
   * Plant render size as a multiple of the default, for themes whose plot is
   * physically smaller in frame and would otherwise look overcrowded.
   */
  plantScale?: number;
  /** 25 slot centers (5x5 isometric grid), as % of field image width/height. */
  slots: { x: number; y: number }[];
}

/**
 * Slot order is load-bearing: the board fills contiguously from index 0, so
 * index order *is* planting order (back row first, left to right).
 */
export const GARDEN_THEMES: GardenTheme[] = [
${entries.join("\n")}
];

/** The theme the Garden screen shows. Swap the slug to change it. */
export const DEFAULT_THEME_SLUG = 'main-garden';

export function themeBySlug(slug: string): GardenTheme {
  return GARDEN_THEMES.find((t) => t.slug === slug) ?? GARDEN_THEMES[0];
}
`

fs.writeFileSync(path.join(ROOT, "src/data/gardenThemes.ts"), out)
console.log(`themes: ${entries.length}`)
