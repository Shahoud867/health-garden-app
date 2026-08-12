#!/usr/bin/env node
/**
 * Generates the app's PWA/favicon icon set as real PNG files, with zero
 * external dependencies (no ImageMagick/Inkscape/sharp available in every
 * environment this might run in, and none are worth adding as a build
 * dependency for one icon).
 *
 * Draws a simple sprout glyph (stem + bud + two leaves — the same growth
 * motif the garden mechanic itself is built around) on the app's real
 * established brand green (`#6c9e36`, matching WeightScreen's "Saved"
 * button and every screen's primary action color), in the app's real
 * accent cream (`#fff8ee`, matching WeightScreen's chart-dot stroke) --
 * not invented colors, the ones already in use throughout `src/screens/*`.
 *
 * Run with `node scripts/generate-icons.mjs` -- re-run any time the glyph
 * needs to change; nothing here is meant to be hand-edited as binary.
 */
import { deflateSync, crc32 } from "node:zlib"
import { writeFileSync, mkdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.resolve(__dirname, "../public/icons")

const BRAND_GREEN = [0x6c, 0x9e, 0x36]
const CREAM = [0xff, 0xf8, 0xee]

function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

/** Signed distance-ish membership tests, all in normalized [0,1] icon space. */
function inCircle(x, y, cx, cy, r) {
  const dx = x - cx
  const dy = y - cy
  return dx * dx + dy * dy <= r * r
}
function inRoundedRect(x, y, x0, y0, x1, y1, r) {
  const cx = Math.min(Math.max(x, x0 + r), x1 - r)
  const cy = Math.min(Math.max(y, y0 + r), y1 - r)
  if (x >= x0 + r && x <= x1 - r) return y >= y0 && y <= y1
  if (y >= y0 + r && y <= y1 - r) return x >= x0 && x <= x1
  return inCircle(x, y, cx, cy, r)
}

/**
 * @param {number} size pixel dimensions (square)
 * @param {{ maskable: boolean }} opts maskable = full-bleed square background
 *   (OS applies its own mask shape, so no corner rounding and the glyph must
 *   stay inside the ~80% "safe zone"); non-maskable gets a rounded-square
 *   background so it reads correctly wherever no mask is applied.
 */
function renderIcon(size, { maskable }) {
  const buf = Buffer.alloc(size * size * 4)
  const bgCornerRadius = maskable ? 0 : size * 0.22

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const x = (px + 0.5) / size
      const y = (py + 0.5) / size
      const i = (py * size + px) * 4

      const onBg = maskable
        ? true
        : inRoundedRect(x, y, 0, 0, 1, 1, bgCornerRadius / size)

      let rgb = onBg ? BRAND_GREEN : [0, 0, 0]
      let alpha = onBg ? 255 : 0

      // Stem
      if (inRoundedRect(x, y, 0.46, 0.5, 0.54, 0.8, 0.03)) {
        rgb = CREAM
      }
      // Bud
      if (inCircle(x, y, 0.5, 0.4, 0.15)) {
        rgb = CREAM
      }
      // Left leaf
      if (inCircle(x, y, 0.35, 0.52, 0.1)) {
        rgb = CREAM
      }
      // Right leaf
      if (inCircle(x, y, 0.65, 0.52, 0.1)) {
        rgb = CREAM
      }

      buf[i] = rgb[0]
      buf[i + 1] = rgb[1]
      buf[i + 2] = rgb[2]
      buf[i + 3] = alpha
    }
  }
  return buf
}

function crcOf(buf) {
  return crc32(buf) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii")
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crcInput = Buffer.concat([typeBuf, data])
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crcOf(crcInput), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

/** Encodes an RGBA pixel buffer (row-major, 4 bytes/px) as a real PNG. */
function encodePng(rgba, size) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(size, 0) // width
  ihdrData.writeUInt32BE(size, 4) // height
  ihdrData[8] = 8 // bit depth
  ihdrData[9] = 6 // color type: RGBA
  ihdrData[10] = 0 // compression
  ihdrData[11] = 0 // filter
  ihdrData[12] = 0 // interlace
  const ihdr = chunk("IHDR", ihdrData)

  // One filter-type byte (0 = None) prefixed per scanline, per the PNG spec.
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1)
    raw[rowStart] = 0
    rgba.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4)
  }
  const idat = chunk("IDAT", deflateSync(raw, { level: 9 }))

  const iend = chunk("IEND", Buffer.alloc(0))

  return Buffer.concat([signature, ihdr, idat, iend])
}

mkdirSync(OUT_DIR, { recursive: true })

const targets = [
  { file: "icon-192.png", size: 192, maskable: false },
  { file: "icon-512.png", size: 512, maskable: false },
  { file: "icon-maskable-512.png", size: 512, maskable: true },
  { file: "apple-touch-icon.png", size: 180, maskable: false },
]

for (const t of targets) {
  const png = encodePng(renderIcon(t.size, { maskable: t.maskable }), t.size)
  writeFileSync(path.join(OUT_DIR, t.file), png)
  console.log(`wrote ${t.file} (${png.length} bytes)`)
}
