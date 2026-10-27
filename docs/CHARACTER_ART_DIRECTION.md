# Wildbound character direction / native hair contract v1

## Visual target

The user supplied the elf adventurer, cartoon outfit group and Bera animation as
style references. They are not approval of any Wildbound study. Translate their
clear silhouettes, expressive eyes, broad color clusters and limited warm/cool
ramps into the existing editable rig. Do not paste a rendered portrait onto it.

Priority: silhouette → facial expression → grouped values → attachment fit →
motion. Avoid flat helmet-shaped hair, rectangular curtains, peg noses, tiny
strands, material noise and harsh joint seams. Skeletons are cute: rounded skulls,
gentle oversized sockets, cheeks, tiny nasal cavity and small toothy smile.

## One hair grammar

`src/hair-design.mjs` owns the nineteen existing IDs (including bald), four-tone
palette and `crown`, `fringe`, `temples`, `nape`, `accessory` part grammar.
Recipes specify volume, fringe, nape length, tail/braid/bun and parting. Coordinates
are skull-local world pixels, scan converted onto a half-pixel grid. They are not
full-character animation frames. Crown stays attached; lower locks have restrained
motion on moving clips and remain still in sleep/death.

Eight views: 0 south/front, 1 SW, 2 west/profile, 3 NW, 4 north/back, 5 NE,
6 east/profile, 7 SE. Rear diagonals retain near-side temple geometry; rear views
must not expose facial hair. Preserve asymmetric parting when turning.

Appearance fields:

- `hair`, `hairColor`: existing save IDs and color.
- `hairDesign`: optional `fringe`, `part` (left/right), `volume` (-1…2),
  `length` (0…12). Missing fields use the selected hairstyle recipe.
- `facialHair`: none, stubble, moustache, goatee, shortbeard, fullbeard, sideburns.
- `facialHairColor`: optional; absence follows hair color.

Beards no longer require sacrificing freckles/scars/other face details. Legacy
face=beard/goatee/stubble remains supported unless an explicit facialHair choice
overrides it. No saved appearance is rewritten by rendering.

## Editing and preservation

Animation Studio / Appearance and the Field Kit expose Hair construction controls
alongside independent facial-hair choices and custom colors. Recipe source is
native code/data; rendered parts can be captured/painted with existing sprite tools.
The player has a distinct Hair / nape and accessory layer behind head/body.
Per-facing wearable pixels/offsets and boneSprites take priority. April and the
Captain use the same recipe renderer through their existing hair layers.

No atlas manifest: this pass creates native procedural parts, not an atlas.

## Lighting

Character lighting uses the existing sky/torch/lantern/fire/house/temple light
sources. Up to four nearby lights add directional, alpha-clipped color to the
assembled actor, including equipped items. Animation caches retain unlit pixels;
labels and background are not tinted. This is lightweight 2D palette lighting,
not per-pixel normal maps or light/wall occlusion. Do not claim measured FPS gains.

## Review gates

`scripts/review-character-direction.cjs` uses isolated muted Electron and actual
shared rigs. It creates enlarged/native-size eight-view hair/facial-hair/skeleton
studies plus lighting samples. `scripts/preview-characters.cjs` covers assembled
player idle/run, gear, April and Captain. `scripts/review-native-wardrobe.cjs`
checks equipped art across eight facings and seven action states. Unit tests
check data/coverage, not whether the user likes a silhouette. Never label a
rejected draft finished merely because it passes tests.
