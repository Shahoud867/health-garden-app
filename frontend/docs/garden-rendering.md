# Garden board rendering

How plants get positioned, sized, and layered on a theme's field art.

Everything here is presentation. What decides _which_ plants exist and when
they're earned is the garden mechanic — see
[`../../docs/garden-mechanic-v2-backend-impact.md`](../../docs/garden-mechanic-v2-backend-impact.md).

Code: [`src/components/GardenBoard.tsx`](../src/components/GardenBoard.tsx),
data: [`src/data/gardenThemes.ts`](../src/data/gardenThemes.ts).

---

## 1. The board

Each theme is one piece of isometric field art plus **25 slot coordinates** in a
5×5 grid. Slots are stored as **percentages** of the field image's width and
height, not pixels, so the board scales to any viewport without recomputation.

Slot **order is load-bearing**: index 0 is the back-left slot and index 24 the
front-right, walking left-to-right along each row from back to front. The board
fills contiguously from index 0, so index order _is_ planting order. Nothing
sorts or filters this array — reordering it silently changes which physical
slot a plant lands in.

---

## 2. Layering — three rules

These three together are what make flat PNG sprites sit convincingly inside a
3D-looking scene. All three are in `GardenBoard.tsx`.

### 2.1 Ground anchor

```
transform: translate(-50%, -92%)
```

A slot coordinate marks where a plant **meets the ground**, not its centre.
Sprites vary in height (a full sunflower is much taller than a succulent), so
anchoring near the base is what keeps every plant standing on the same ground
line instead of floating at different heights.

`-92%` rather than `-100%` deliberately sinks the sprite slightly into the soil,
which reads as planted rather than resting on top.

> ⚠️ If an animation library is ever added here, keep this transform on its
> own wrapper element. Libraries that animate `x`/`y`/`scale` take exclusive
> ownership of the CSS `transform` property and silently overwrite one set via
> `style` on the same element — which reads as "every plant is mis-positioned"
> with no obvious cause. That exact bug has already cost time once.

### 2.2 Depth scale

```ts
depthScale(y) = 0.82 + t * 0.24; // t = normalised y within this theme
```

Plants nearer the camera (higher `y`) render up to ~24% larger than those at the
back. The theme art is drawn in perspective; a flat scale makes back-row plants
look oversized and breaks the illusion.

Normalising against **this theme's own** min/max `y` matters — plots occupy
different fractions of their frame, so a fixed y-to-scale mapping would be wrong
for most themes.

### 2.3 Z-order (occlusion)

```ts
zIndex: Math.round(pos.y * 10);
```

A plant nearer the camera must paint **over** one behind it.

This is derived from the slot's own `y`, deliberately **not** left to DOM order.
Painting order only happens to be correct while `theme.slots` stays in
back-to-front order — it would break silently once real rows arrive from
Supabase sorted by `planted_at` instead of `slot_index`, and the symptom
(back-row plants covering front-row plants) gives no hint of the cause.

---

## 3. Coordinate pipeline

Coordinates are captured by hand, because automated detection was tried and
failed: the field art is dense painterly rendering where lit windows, lanterns,
flowers, and mushrooms are as bright and saturated as the actual slot markers.
Pixel-diffing `grid.png` against `bald.png` didn't work either — those pairs
aren't pixel-aligned exports of the same base file.

```
tools/marker-picker.html   open in a browser, click 25 markers per theme
        ↓  export JSON
tools/slots.json           raw capture — source of truth
        ↓  node tools/generate-themes.mjs
src/data/gardenThemes.ts          GENERATED — never hand-edit
```

Only the empty field art under `public/themes/<slug>/field.png` is versioned.
The marker overlays used to capture coordinates are a design-time input with
no runtime use, so they stay out of the repository — keep them wherever you
keep the source art.

### Adding a theme

1. Save the empty field art to `public/themes/<slug>/field.png`. Keep the
   marker version (same art with the 25 planting spots drawn on) to hand —
   it does not belong in the repo.
2. Open `tools/marker-picker.html` in a browser, load the marker image, and
   click all 25 spots **in reading order** — left→right, back row first.
   Right-click undoes.
3. Export the JSON and merge it into `tools/slots.json`.
4. Run `node tools/generate-themes.mjs`. It regenerates
   `src/data/gardenThemes.ts`, and fails loudly if a theme is missing its
   field art or does not have exactly 25 slots.

---

## 4. Per-theme corrections

Live in `ADJUSTMENTS` / `PLANT_SCALE` in
[`../tools/generate-themes.mjs`](../tools/generate-themes.mjs) —
**not** edited into `gardenThemes.ts`, so a re-capture can't silently discard them.

| Theme         | Correction         | Why                                                                                                                                               |
| ------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `back garden` | `yOffset: -3.5`    | The back row of markers sat on a cast shadow rather than a planting row, pushing the whole grid forward until the front row overlapped the fence. |
| `greenhouse`  | `plantScale: 0.78` | Its plot is physically smaller in frame; at default size the 5×5 grid looked crammed.                                                             |

`plantScale` is a per-theme override precisely so tuning one theme can't disturb
the fifteen already approved.

---

## 5. Plant sprites

Five plants × four growth stages, at `public/plants/<plant>/stage-<0..3>.png`.

Folder names match this app's own `PlantState['type']` values, so a plant in
state maps straight to its artwork. Those names differ from the database's
`plant_type` column, so anything reading real rows must translate:

| Folder here  | Database `plant_type` | Habit                          |
| ------------ | --------------------- | ------------------------------ |
| `bellflower` | `mint`                | hydration                      |
| `cactus`     | `cactus`              | no junk food                   |
| `bamboo`     | `wheat_stalk`         | primary goal (varies per user) |
| `sunflower`  | `sapling`             | movement                       |
| `succulent`  | `succulent`           | consistency                    |

**Only stage 3 renders on the board** — the permanent garden holds finished
plants only. Stages 0–2 appear in the "growing this week" list and on Home.

Sprites are transparent RGBA at varying dimensions; the ground anchor (§2.1) is
what makes inconsistent heights render correctly, so they don't need uniform
canvases.

A CSS filter (`saturate(1.35) contrast(1.08)` plus a drop shadow) compensates
for the sprites reading thin against painterly backgrounds. It narrows the gap
but doesn't close it — that would need the sprite art itself rendered in the
same style as the field art.

---

## 6. Current state

Nothing is wired to Supabase yet. `GardenScreen` derives which plants are
planted from the weekly mock data via `earnedPlants()`, and the "My gardens"
tab uses a small fixed list of completed boards. Both are marked in the source
as placeholders.

When wiring it up, `GardenBoard` needs one row per earned plant carrying
`board_number`, `slot_index`, and `plant_type`. Three things to preserve:

- **Order rows by `slot_index`**, not `planted_at` (§1) — the array's order is
  the planting order.
- **Translate `plant_type`** to the folder names in §5 before building the
  image path.
- **Only fully grown plants** belong on this board; a plant reaches it by
  finishing its growth cycle, never part-way.
