import React from 'react'
export type PlantType = 'cactus' | 'sunflower' | 'bellflower' | 'bamboo' | 'succulent'

interface PlantSVGProps {
  plant: PlantType
  stage: 0 | 1 | 2 | 3
  dormant?: boolean
  size?: number
  className?: string
}

const Pot = () => (
  <g>
    <path d="M28,76 L24,108 L76,108 L72,76 Z" fill="#C27B52"/>
    <path d="M60,76 L72,76 L76,108 L64,108 Z" fill="#A86640" opacity="0.25"/>
    <rect x="20" y="68" width="60" height="10" rx="5" fill="#D49070"/>
    <rect x="20" y="68" width="60" height="10" rx="5" fill="none" stroke="#B87856" strokeWidth="0.6"/>
    <ellipse cx="50" cy="74" rx="24" ry="5" fill="#8B6240"/>
    <ellipse cx="44" cy="72.5" rx="11" ry="3" fill="#A07850" opacity="0.45"/>
  </g>
)

/* ── CACTUS ── */
const Cactus0 = () => (
  <g>
    <ellipse cx="50" cy="62" rx="8" ry="12" fill="#5A8830"/>
    <ellipse cx="50" cy="62" rx="8" ry="12" fill="none" stroke="#3D6A1E" strokeWidth="0.8"/>
    <ellipse cx="48" cy="57" rx="3" ry="5" fill="#78A848" opacity="0.5"/>
  </g>
)

const Cactus1 = () => (
  <g>
    <rect x="43" y="38" width="14" height="36" rx="7" fill="#5A8830"/>
    <rect x="43" y="38" width="14" height="36" rx="7" fill="none" stroke="#3D6A1E" strokeWidth="0.8"/>
    <rect x="46" y="40" width="4" height="30" rx="2" fill="#78A848" opacity="0.45"/>
    <line x1="39" y1="46" x2="43" y2="44" stroke="#2D5A14" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="39" y1="56" x2="43" y2="54" stroke="#2D5A14" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="61" y1="46" x2="57" y2="44" stroke="#2D5A14" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="61" y1="56" x2="57" y2="54" stroke="#2D5A14" strokeWidth="1.5" strokeLinecap="round"/>
  </g>
)

const Cactus2 = () => (
  <g>
    <rect x="42" y="18" width="16" height="56" rx="8" fill="#5A8830"/>
    <rect x="42" y="18" width="16" height="56" rx="8" fill="none" stroke="#3D6A1E" strokeWidth="0.8"/>
    <rect x="45" y="20" width="4" height="50" rx="2" fill="#78A848" opacity="0.4"/>
    {/* Left arm */}
    <path d="M42,36 C33,36 27,44 27,50 L33,50 C33,46 40,44 42,42Z" fill="#5A8830"/>
    <rect x="23" y="34" width="12" height="22" rx="6" fill="#5A8830"/>
    <rect x="23" y="34" width="12" height="22" rx="6" fill="none" stroke="#3D6A1E" strokeWidth="0.8"/>
    {/* Right arm */}
    <path d="M58,44 C67,44 73,52 73,58 L67,58 C67,54 60,52 58,50Z" fill="#5A8830"/>
    <rect x="65" y="42" width="12" height="20" rx="6" fill="#5A8830"/>
    <rect x="65" y="42" width="12" height="20" rx="6" fill="none" stroke="#3D6A1E" strokeWidth="0.8"/>
    <line x1="38" y1="24" x2="42" y2="22" stroke="#2D5A14" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="62" y1="24" x2="58" y2="22" stroke="#2D5A14" strokeWidth="1.5" strokeLinecap="round"/>
  </g>
)

const Cactus3 = () => (
  <g>
    <rect x="41" y="8" width="18" height="66" rx="9" fill="#5A8830"/>
    <rect x="41" y="8" width="18" height="66" rx="9" fill="none" stroke="#3D6A1E" strokeWidth="0.8"/>
    <rect x="44" y="10" width="5" height="60" rx="2.5" fill="#78A848" opacity="0.4"/>
    {/* Left arm lower */}
    <path d="M41,40 C30,40 22,50 22,56 L28,56 C28,52 38,48 41,46Z" fill="#5A8830"/>
    <rect x="18" y="34" width="13" height="30" rx="6.5" fill="#5A8830"/>
    <rect x="18" y="34" width="13" height="30" rx="6.5" fill="none" stroke="#3D6A1E" strokeWidth="0.8"/>
    {/* Right arm upper */}
    <path d="M59,26 C70,26 78,36 78,42 L72,42 C72,38 62,34 59,32Z" fill="#5A8830"/>
    <rect x="69" y="18" width="13" height="30" rx="6.5" fill="#5A8830"/>
    <rect x="69" y="18" width="13" height="30" rx="6.5" fill="none" stroke="#3D6A1E" strokeWidth="0.8"/>
    <line x1="37" y1="14" x2="41" y2="12" stroke="#2D5A14" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="37" y1="24" x2="41" y2="22" stroke="#2D5A14" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="63" y1="14" x2="59" y2="12" stroke="#2D5A14" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="63" y1="24" x2="59" y2="22" stroke="#2D5A14" strokeWidth="1.5" strokeLinecap="round"/>
  </g>
)

/* ── SUNFLOWER ── */
const Sunflower0 = () => (
  <g>
    <rect x="49" y="46" width="2" height="28" fill="#7A8C30"/>
    <path d="M50,58 C42,52 38,56 40,62 C44,64 48,61 50,58Z" fill="#8AAC50"/>
    <path d="M50,58 C58,52 62,56 60,62 C56,64 52,61 50,58Z" fill="#8AAC50"/>
    <path d="M50,58 C42,52 38,56 40,62 C44,64 48,61 50,58Z" fill="none" stroke="#628830" strokeWidth="0.6"/>
    <path d="M50,58 C58,52 62,56 60,62 C56,64 52,61 50,58Z" fill="none" stroke="#628830" strokeWidth="0.6"/>
  </g>
)

const Sunflower1 = () => (
  <g>
    <rect x="49" y="28" width="2" height="46" fill="#7A8C30"/>
    {/* Leaves */}
    <path d="M50,50 C42,44 36,48 38,56 C43,58 48,54 50,50Z" fill="#8AAC50"/>
    <path d="M50,50 C58,44 64,48 62,56 C57,58 52,54 50,50Z" fill="#8AAC50"/>
    <path d="M50,40 C43,36 39,40 42,46 C46,47 49,43 50,40Z" fill="#8AAC50"/>
    {/* Bud */}
    <ellipse cx="50" cy="28" rx="7" ry="8" fill="#5A8A30"/>
    <ellipse cx="50" cy="28" rx="7" ry="8" fill="none" stroke="#3D6A18" strokeWidth="0.8"/>
    <ellipse cx="48" cy="25" rx="3" ry="4" fill="#78A840" opacity="0.5"/>
  </g>
)

const Sunflower2 = () => (
  <g>
    <rect x="49" y="16" width="2" height="58" fill="#7A8C30"/>
    {/* Leaves */}
    <path d="M50,54 C40,46 34,52 36,60 C42,62 48,58 50,54Z" fill="#8AAC50"/>
    <path d="M50,54 C60,46 66,52 64,60 C58,62 52,58 50,54Z" fill="#8AAC50"/>
    <path d="M50,40 C42,34 38,40 40,48 C45,49 49,44 50,40Z" fill="#8AAC50"/>
    {/* Opening petals */}
    {[0,45,90,135,180,225,270,315].map((a, i) => (
      <ellipse key={i}
        cx={50 + 12 * Math.cos(a * Math.PI / 180)}
        cy={17 + 12 * Math.sin(a * Math.PI / 180)}
        rx="4" ry="8"
        transform={`rotate(${a}, ${50 + 12 * Math.cos(a * Math.PI / 180)}, ${17 + 12 * Math.sin(a * Math.PI / 180)})`}
        fill="#F5C820" opacity="0.9"
      />
    ))}
    <circle cx="50" cy="17" r="8" fill="#8B5E3C"/>
    <circle cx="50" cy="17" r="6" fill="#6B4428"/>
    <circle cx="47" cy="15" r="1.5" fill="#8B6040" opacity="0.7"/>
    <circle cx="52" cy="14" r="1.5" fill="#8B6040" opacity="0.7"/>
    <circle cx="50" cy="19" r="1.5" fill="#8B6040" opacity="0.7"/>
  </g>
)

const Sunflower3 = () => (
  <g>
    <rect x="49" y="10" width="2" height="64" fill="#7A8C30"/>
    {/* Big leaves */}
    <path d="M50,56 C38,46 30,54 32,64 C40,68 48,62 50,56Z" fill="#8AAC50"/>
    <path d="M50,56 C62,46 70,54 68,64 C60,68 52,62 50,56Z" fill="#8AAC50"/>
    <path d="M50,40 C40,32 34,40 36,50 C43,52 49,46 50,40Z" fill="#8AAC50"/>
    <path d="M50,40 C60,32 66,40 64,50 C57,52 51,46 50,40Z" fill="#8AAC50"/>
    {/* Full petals */}
    {[0,30,60,90,120,150,180,210,240,270,300,330].map((a, i) => (
      <ellipse key={i}
        cx={50 + 14 * Math.cos(a * Math.PI / 180)}
        cy={11 + 14 * Math.sin(a * Math.PI / 180)}
        rx="4.5" ry="10"
        transform={`rotate(${a}, ${50 + 14 * Math.cos(a * Math.PI / 180)}, ${11 + 14 * Math.sin(a * Math.PI / 180)})`}
        fill="#F5C820"
      />
    ))}
    <circle cx="50" cy="11" r="11" fill="#8B5E3C"/>
    <circle cx="50" cy="11" r="9" fill="#6B4428"/>
    {[0,60,120,180,240,300].map((a, i) => (
      <circle key={i}
        cx={50 + 5 * Math.cos(a * Math.PI / 180)}
        cy={11 + 5 * Math.sin(a * Math.PI / 180)}
        r="1.8" fill="#A87860" opacity="0.8"
      />
    ))}
    <circle cx="50" cy="11" r="2" fill="#A87860" opacity="0.8"/>
  </g>
)

/* ── BELLFLOWER (blue) ── */
const Bell = ({ cx, cy, r = 1 }: { cx: number; cy: number; r?: number }) => (
  <g transform={`translate(${cx}, ${cy}) scale(${r})`}>
    <path d="M0,-10 C-5,-8 -7,-2 -7,4 C-7,9 -4,12 0,13 C4,12 7,9 7,4 C7,-2 5,-8 0,-10Z" fill="#5E8AC8"/>
    <path d="M0,-10 C-5,-8 -7,-2 -7,4 C-7,9 -4,12 0,13 C4,12 7,9 7,4 C7,-2 5,-8 0,-10Z" fill="none" stroke="#3E6AA8" strokeWidth="0.9"/>
    <path d="M-5,-5 C-3,-4 -1,-4 0,-5" fill="none" stroke="#7AAAE0" strokeWidth="0.9" opacity="0.7"/>
    <line x1="0" y1="12" x2="0" y2="18" stroke="#D4A820" strokeWidth="1.2" strokeLinecap="round"/>
  </g>
)

const Bellflower0 = () => (
  <g>
    <rect x="49" y="54" width="2" height="20" fill="#7A8C30"/>
    <path d="M50,62 C44,58 40,62 42,68 C45,70 49,66 50,62Z" fill="#8AAC50"/>
    <path d="M50,62 C56,58 60,62 58,68 C55,70 51,66 50,62Z" fill="#8AAC50"/>
  </g>
)

const Bellflower1 = () => (
  <g>
    <rect x="49" y="30" width="2" height="44" fill="#7A8C30"/>
    <path d="M50,52 C44,46 38,50 40,58 C44,60 49,56 50,52Z" fill="#8AAC50"/>
    <Bell cx={50} cy={36} r={0.9}/>
  </g>
)

const Bellflower2 = () => (
  <g>
    <rect x="49" y="18" width="2" height="56" fill="#7A8C30"/>
    {/* Branches */}
    <path d="M50,34 L44,26" stroke="#7A8C30" strokeWidth="2" strokeLinecap="round"/>
    <path d="M50,34 L56,26" stroke="#7A8C30" strokeWidth="2" strokeLinecap="round"/>
    <path d="M50,52 C42,44 36,50 38,58 C43,62 49,57 50,52Z" fill="#8AAC50"/>
    <path d="M50,42 C43,38 40,44 42,50 C46,51 50,47 50,42Z" fill="#8AAC50"/>
    <Bell cx={44} cy={22} r={0.85}/>
    <Bell cx={56} cy={22} r={0.85}/>
  </g>
)

const Bellflower3 = () => (
  <g>
    <rect x="49" y="10" width="2" height="64" fill="#7A8C30"/>
    {/* Main branches */}
    <path d="M50,22 L40,14" stroke="#7A8C30" strokeWidth="2" strokeLinecap="round"/>
    <path d="M50,22 L60,14" stroke="#7A8C30" strokeWidth="2" strokeLinecap="round"/>
    <path d="M50,36 L42,28" stroke="#7A8C30" strokeWidth="2" strokeLinecap="round"/>
    <path d="M50,36 L58,28" stroke="#7A8C30" strokeWidth="2" strokeLinecap="round"/>
    {/* Leaves */}
    <path d="M50,52 C40,44 32,50 34,60 C40,64 48,59 50,52Z" fill="#8AAC50"/>
    <path d="M50,52 C60,44 68,50 66,60 C60,64 52,59 50,52Z" fill="#8AAC50"/>
    <path d="M50,40 C43,34 40,42 43,48 C47,50 50,45 50,40Z" fill="#8AAC50"/>
    {/* Flowers */}
    <Bell cx={40} cy={10} r={0.9}/>
    <Bell cx={60} cy={10} r={0.9}/>
    <Bell cx={42} cy={24} r={0.85}/>
    <Bell cx={58} cy={24} r={0.85}/>
    <Bell cx={50} cy={8} r={0.95}/>
  </g>
)

/* ── BAMBOO ── */
const BambooStalk = ({ x, h, leafDir }: { x: number; h: number; leafDir: 1 | -1 }) => (
  <g>
    <rect x={x - 4} y={74 - h} width="8" height={h} rx="4" fill="#7AAA44"/>
    <rect x={x - 4} y={74 - h} width="8" height={h} rx="4" fill="none" stroke="#5A8830" strokeWidth="0.7"/>
    {/* nodes */}
    {[h * 0.3, h * 0.6].map((v, i) => (
      <rect key={i} x={x - 5} y={74 - v} width="10" height="3" rx="1.5" fill="#5A8830" opacity="0.7"/>
    ))}
    {/* leaves */}
    <path d={`M${x},${74 - h + 4} C${x + leafDir * 20},${74 - h - 8} ${x + leafDir * 22},${74 - h + 6} ${x},${74 - h + 12}Z`} fill="#90C060" opacity="0.9"/>
    <path d={`M${x},${74 - h * 0.5} C${x + leafDir * 18},${74 - h * 0.5 - 10} ${x + leafDir * 20},${74 - h * 0.5 + 4} ${x},${74 - h * 0.5 + 10}Z`} fill="#90C060" opacity="0.8"/>
  </g>
)

const Bamboo0 = () => (
  <g>
    <ellipse cx="50" cy="66" rx="10" ry="8" fill="#8B7440"/>
    <ellipse cx="50" cy="66" rx="10" ry="8" fill="none" stroke="#6B5428" strokeWidth="0.8"/>
    <ellipse cx="47" cy="64" rx="5" ry="3" fill="#A08A58" opacity="0.5"/>
  </g>
)

const Bamboo1 = () => <BambooStalk x={50} h={42} leafDir={1}/>

const Bamboo2 = () => (
  <g>
    <BambooStalk x={44} h={48} leafDir={-1}/>
    <BambooStalk x={57} h={38} leafDir={1}/>
  </g>
)

const Bamboo3 = () => (
  <g>
    <BambooStalk x={36} h={52} leafDir={-1}/>
    <BambooStalk x={47} h={64} leafDir={1}/>
    <BambooStalk x={57} h={44} leafDir={-1}/>
    <BambooStalk x={66} h={34} leafDir={1}/>
  </g>
)

/* ── SUCCULENT ── */
const Leaf = ({ angle, r, size }: { angle: number; r: number; size: number }) => {
  const rad = (angle * Math.PI) / 180
  const cx = 50 + r * Math.cos(rad)
  const cy = 50 + r * Math.sin(rad) * 0.6
  return (
    <ellipse
      cx={cx} cy={cy}
      rx={size * 0.55} ry={size}
      transform={`rotate(${angle + 90}, ${cx}, ${cy})`}
      fill="#8AB87A"
    />
  )
}

const Succulent0 = () => (
  <g>
    <ellipse cx="50" cy="62" rx="7" ry="5" fill="#A8C890"/>
    <ellipse cx="50" cy="62" rx="7" ry="5" fill="none" stroke="#78A870" strokeWidth="0.7"/>
    <ellipse cx="50" cy="60" rx="4" ry="3" fill="#B8D8A0"/>
  </g>
)

const Succulent1 = () => (
  <g>
    {[0, 72, 144, 216, 288].map((a, i) => <Leaf key={i} angle={a} r={12} size={8}/>)}
    <circle cx="50" cy="50" r="6" fill="#B8D8A0"/>
    <circle cx="50" cy="50" r="4" fill="#C8E8B0"/>
  </g>
)

const Succulent2 = () => (
  <g>
    {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => <Leaf key={i} angle={a} r={18} size={10}/>)}
    {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5].map((a, i) => <Leaf key={i+8} angle={a} r={9} size={7}/>)}
    <circle cx="50" cy="50" r="6" fill="#C8E8B0"/>
  </g>
)

const Succulent3 = () => (
  <g>
    {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((a, i) => <Leaf key={i} angle={a} r={22} size={12}/>)}
    {[18, 54, 90, 126, 162, 198, 234, 270].map((a, i) => <Leaf key={i+10} angle={a} r={13} size={9}/>)}
    {[0, 60, 120, 180, 240, 300].map((a, i) => <Leaf key={i+18} angle={a} r={7} size={6}/>)}
    <circle cx="50" cy="50" r="5" fill="#D8F0C0"/>
  </g>
)

/* ── Map ── */
type Stage = 0 | 1 | 2 | 3
const PLANT_COMPONENTS: Record<PlantType, Record<Stage, () => React.ReactElement>> = {
  cactus:     { 0: Cactus0,     1: Cactus1,     2: Cactus2,     3: Cactus3     },
  sunflower:  { 0: Sunflower0,  1: Sunflower1,  2: Sunflower2,  3: Sunflower3  },
  bellflower: { 0: Bellflower0, 1: Bellflower1, 2: Bellflower2, 3: Bellflower3 },
  bamboo:     { 0: Bamboo0,     1: Bamboo1,     2: Bamboo2,     3: Bamboo3     },
  succulent:  { 0: Succulent0,  1: Succulent1,  2: Succulent2,  3: Succulent3  },
}

export default function PlantSVG({ plant, stage, dormant = false, size = 100, className = '' }: PlantSVGProps) {
  const PlantComp = PLANT_COMPONENTS[plant][stage]
  return (
    <svg
      viewBox="0 0 100 120"
      width={size}
      height={size * 1.2}
      className={className}
      style={{ filter: dormant ? 'saturate(0.45) brightness(1.05)' : undefined, transition: 'filter 0.4s ease' }}
      aria-hidden="true"
    >
      <PlantComp/>
      <Pot/>
      {dormant && (
        <g>
          <circle cx="76" cy="14" r="10" fill="#FCF7EC" stroke="#D8CDB8" strokeWidth="1"/>
          <text x="76" y="18" textAnchor="middle" fontSize="12">🌙</text>
        </g>
      )}
    </svg>
  )
}
