# Developer sprite-sheet pipeline

Generation used the built-in imagegen tool, not an in-app AI feature. The final source lives at `assets/concept-sheet.png`; converted assets live at `assets/library.json`.

## Generation prompt

Create a production pixel art sprite atlas for original jungle adventure game Wildbound. EXACTLY 5 columns x 5 rows evenly spaced on a square image, all cells same size, each sprite centered in its cell with generous empty padding, no grid lines, no text, no labels. True transparent background. 1990s rich 32-bit pixel art, hard pixel edges, cohesive limited earthy palette emerald olive amber terracotta ivory, view overhead three-quarter top-down suited to Zelda-like game. Each object separate and complete, no shadows extending outside cell. Readable silhouettes at 48x48 pixels.

Row 1 left to right: golden lion with mane, purple bat wings spread, coiled green snake, green crocodile, brown monkey.

Row 2: carnivorous vine plant, brown wild boar, giant amber wasp, moss-covered stone golem, blue black scarab beetle.

Row 3: black panther, explorer with teal scarf and tan hat, explorer with coral scarf and tan hat, explorer with blue scarf and tan hat, explorer with yellow scarf and tan hat.

Row 4: explorer with purple scarf and tan hat, explorer with green scarf and tan hat, wooden spiked animal trap, red healing fruit, golden carved jungle shrine.

Row 5: fern cluster, large jungle tree, mossy boulder, ancient carved square wooden magical board game table seen from above, jungle flower.

Consistent scale. Not a mockup. No scenery. Sprite sheet image only.

## Import and verify

The generated sheet was visually reviewed. Its rows are not mathematically uniform, so the checked-in manifest supplies individual crop rectangles. Do not assume any AI-generated sheet is perfectly aligned.

Run `node scripts/import-sheet.mjs SOURCE.png MANIFEST.json OUTPUT.json`. A manifest needs `columns`, `rows`, `size`, and an array of `names`. Optional `rects` override the equal grid. `quantize` maps colors to the game's 30-color palette; `removeBackground` enables border-connected color removal. Actual alpha is preserved by default.

The converter trims transparent margins, fits the subject into an exact square canvas with two-pixel padding, samples pixels with no smoothing, optionally matches the palette, then writes palette indexes. It is shared with the app's crop importer, not a separate manual art process.

Open the result in the Sprite Workshop, check silhouettes at game scale, fix any stray pixels, and export the library. For a new creature's behavior, add its event and AI in `src/core.mjs`; art imports alone do not introduce behavior.

Never overwrite the original generated sheet when cleaning up sprites. Keep the source, crop manifest, and editable output together so batches remain reproducible.
