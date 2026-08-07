import type { PlantState } from '../types'

/** The five plant kinds, taken from the app's own state shape. */
type PlantType = PlantState['type']

/**
 * Renders the illustrated plant artwork from public/plants/.
 *
 * Deliberately separate from PlantSVG rather than replacing it: PlantSVG is
 * still used by the Auth, Landing, Onboarding and Profile screens, and
 * swapping it out globally would change those designs too.
 *
 * Sprites vary in height (a full sunflower is much taller than a succulent),
 * so `size` sets the *height* and the width follows the artwork. Callers that
 * need a fixed footprint should wrap this in their own box.
 */
export default function PlantImage({
  plant,
  stage,
  dormant = false,
  size = 64,
  className = '',
}: {
  plant: PlantType
  stage: 0 | 1 | 2 | 3
  dormant?: boolean
  size?: number
  className?: string
}) {
  return (
    <img
      src={`/plants/${plant}/stage-${stage}.png`}
      alt=""
      aria-hidden="true"
      draggable={false}
      style={{
        height: size,
        width: 'auto',
        // Resting plants read as quietly waiting, never as failing -- matches
        // the "plants rest, never wilt" rule the rest of the app follows.
        filter: dormant
          ? 'saturate(0.5) brightness(1.04) drop-shadow(0 2px 3px rgba(44,36,24,0.14))'
          : 'drop-shadow(0 2px 4px rgba(44,36,24,0.18))',
        transition: 'filter 0.4s ease',
      }}
      className={className}
    />
  )
}
