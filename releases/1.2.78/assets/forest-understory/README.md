# Wildbound woodland props

Twenty original native pixel assets based on the woodland prop reference supplied by the user on 23 October 2026. Each PNG has a transparent 64×64 canvas and a ground pivot at (32, 55). `manifest.json` provides stable IDs, readable names, families and filenames.

The editable drawing source is `src/forest-props.mjs`. Runtime art is rasterized from that source into a finite shared cache; these PNGs are named exports of the same artwork, not separate replacement art. Regenerate with `WILDBOUND_EXPORT_FOREST_ASSETS=1` and the Electron script `scripts/verify-forest-understory.cjs`.

Families: limestone boulders/stones/pebbles; rounded shrubs; mossy rock groups; porcini and fly agaric mushrooms; woodland daisies; cattail reeds; meadow tufts. Existing forest rocks and bushes retain their gameplay roles. Small nonblocking understory props scatter deterministically away from trails and clearings in finite and streamed forest regions. Cattails decorate river banks.

No bitmap, model or branding asset from Dylearn's repository is used in this set. The separate meadow implementation studies the world-space color, stepped wind and character-displacement techniques in [Dylearn's grass demo](https://github.com/DylearnDev/Dylearn-3D-Pixel-Art-Grass-Demo).
