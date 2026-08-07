import type { PlantState } from '../types'
import type { GardenTheme } from '../data/gardenThemes'
import PlantImage from './PlantImage'

type PlantType = PlantState['type']

/**
 * The permanent garden: a theme's field art with fully-grown plants placed on
 * its 25 planting spots.
 *
 * Three rules make flat sprites sit convincingly inside the isometric scene:
 *
 *  1. Ground anchor -- a slot coordinate marks where a plant *meets the soil*,
 *     not its centre, so plants of different heights share one ground line.
 *  2. Depth scale -- plants nearer the camera render slightly larger, matching
 *     the perspective the field art already implies.
 *  3. Z-order -- a nearer plant paints over one behind it. Derived from the
 *     slot's own y rather than left to DOM order, so it stays correct however
 *     the caller happens to sort its rows.
 */
export default function GardenBoard({
  theme,
  plants,
  rounded = true,
}: {
  theme: GardenTheme
  /** Fully-grown plants, in planting order. Fills back-to-front, no gaps. */
  plants: PlantType[]
  /** Off for the full-bleed hero, on for the smaller cards in My Gardens. */
  rounded?: boolean
}) {
  const ys = theme.slots.map((s) => s.y)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  return (
    <div
      className={`relative w-full overflow-hidden ${rounded ? 'rounded-[26px] border border-[#e6d5ba]' : ''}`}
      style={{ aspectRatio: `${theme.fieldWidth} / ${theme.fieldHeight}` }}
    >
      <img
        src={theme.fieldImage}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
      />

      {plants.slice(0, theme.slots.length).map((plant, i) => {
        const pos = theme.slots[i]
        const t = maxY === minY ? 1 : (pos.y - minY) / (maxY - minY)
        const depth = 0.82 + t * 0.24
        const heightPct = 10 * depth * (theme.plantScale ?? 1)

        return (
          <div
            key={`${plant}-${i}`}
            className="absolute"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              height: `${heightPct}%`,
              // Sink the sprite slightly into the soil so it reads as planted
              // rather than resting on top of it.
              transform: 'translate(-50%, -92%)',
              zIndex: Math.round(pos.y * 10),
            }}
          >
            <img
              src={`/plants/${plant}/stage-3.png`}
              alt=""
              aria-hidden="true"
              draggable={false}
              className="h-full w-auto"
              style={{ filter: 'drop-shadow(0 3px 4px rgba(44,36,24,0.25))' }}
            />
          </div>
        )
      })}
    </div>
  )
}

/** Re-exported so screens can render a single plant without a second import. */
export { PlantImage }
