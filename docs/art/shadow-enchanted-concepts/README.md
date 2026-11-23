# Shadow enchanted forest — generated concepts and native recreation

These four concept sheets were generated with the built-in image-generation tool at the user's explicit request, then used as reference for native editable Wildbound artwork. They are development references, not pasted raster game sprites or a claim of user aesthetic approval. No external API/CLI or API key was used.

- [New forest assets](new-forest-assets.png): Moonveil tree and the seven new props.
- [Small original props](small-props.png): root arch, obsidian, thorns, fungi, bloom, log, stone and candles.
- [Larger landmarks](landmarks.png): gate, ribs, brazier, columns, bones, urn, rubble and buttresses.
- [Environment study](environment.png): the playable route, root-framed exit, three destinations, reflective star water, low clouds and grounded contact blending.

## Native artwork contract

Existing IDs are preserved for save and custom-art compatibility. The Moonveil tree remains wither_tree internally. New props are mooncap_cluster, witch_fern, star_shards and wisp_lantern (small), and moonwell, thorn_shrine and hollow_stump (medium). The complete Shadow Realm catalog has 24 kinds. Most indexed sprites use a 64x64 logical canvas; gate and distant buttress use 128x128. Existing sprite-library overrides retain priority. Foot origin and resource/collision behavior stay separate from appearance.

Concept motifs transferred to code: twisting plum trunks; grouped, stepped violet crowns; dangling stars; luminous mushroom undersides; unfurling fern tips; root-held star crystals; curved lantern boughs and visible flames; spiral water in a low moonwell; a branching shrine rune; a hollow stump's interior fire; leafy roots on arches; crescent-cut stones and urns; ivy on broken columns; mossy foot contacts. Broad shadow/highlight masses were simplified for game scale, with no bitmap slicing, fine fabric grain or noise-based microdetail.

Native sources: src/shadow-forest-art.mjs, src/shadow-concept-polish.mjs, src/shadow-underworld-art.mjs. Contact integration: src/shadow-contact-art.mjs and the non-destructive grounded raster variant in realm-art.mjs. Scene effects: src/shadow-ground-fog.mjs and src/shadow-water-reflections.mjs.

## Prompt set supplied to the built-in generator

### New forest assets

Create a polished 2D PIXEL ART GAME CONCEPT SHEET for Wildbound's dark magically enchanted forest. Landscape sheet, 4 columns by 2 rows, eight isolated complete assets each with generous padding on dark indigo background and small clear labels. Reference concept art to recreate as editable native 64x64 game artwork, not a realistic painting. Chunky stepped silhouettes, broad 3-4 shade clusters, restrained outlines, no fine grain or tiny bevels. Cohesive muted purple foliage, deep plum wood, slate-blue shadow, a few lilac/soft pink magical glows. MOONVEIL TREE: twisting rooted trunk, broad asymmetrical purple canopy with three grouped masses and a few dangling pale stars, gnarled living tree. MOONCAP CLUSTER: three varied violet mushrooms with luminous undersides. WITCH FERN: unfurling curled fern fans. STAR SHARDS: irregular lavender meteor crystals nestled in roots. WISP LANTERN: curved blackwood stake holding a spirit lantern. MOONWELL: low octagonal stone basin with a tiny starry spiral pool. THORN SHRINE: crooked rune monolith embraced by thorn vines and leaves. HOLLOW STUMP: broad hollow stump, twisted roots, leafy crown and luminous violet interior. Elevated three-quarter adventure view, common foot baseline, no characters, UI or photorealism.

### Small props

Create a polished 2D PIXEL ART GAME CONCEPT SHEET for Wildbound's dark enchanted Shadow Realm forest, companion to a muted purple forest prop sheet. Landscape 4 by 2, eight isolated complete concepts, generous padding and small labels on dark indigo. Chunky stepped silhouettes, broad flat 3-4-shade masses, restrained outlines, no fine grain/bevels. Deep indigo, muted plum, dusty lilac, pale pink/cyan accents. ROOT ARCH: braided roots, sparse purple crown, passable opening. SHADOW OBSIDIAN: three asymmetrical midnight crystals with lilac light. THORN FAN: curved thorny plant, moonlit leaves. ECHO FUNGUS: tiered shelves, luminous undersides. SHADOW BLOOM: moonflower on a curling stalk. ASHEN LOG: hollow purple-black trunk, pale end, tiny fungus. VEIL STONE: worn slate rock with a crescent light seam and moss. SOUL CANDLES: uneven ivory-lavender wax candles with pink/violet flames and melting wax. Elevated three-quarter view, fixed foot origin, original development concepts for native editable assets, no humans/UI.

### Landmarks

Create a polished 2D PIXEL ART GAME CONCEPT SHEET for Wildbound's dark enchanted forest ruins. Landscape 4 by 2, eight isolated complete assets, small clear labels, dark indigo background. Chunky stepped silhouettes, broad 3-4-shade masses, muted plum/slate/lilac, restrained moonlit pink/cyan, no tiny noise or realism. SKULL GATE: monumental skull doorway softened by living roots, purple ivy and violet throat. RIB ARCH: weathered curved rib-like stone and dark vines. SOUL BRAZIER: blue-slate pedestal and cold cyan flame. RUIN COLUMNS: uneven broken columns, shared low base, ivy and blue moss. ANCIENT BONES: pale skull and long bones nestled in violet grass. MOON URN: cracked plum vessel, worn crescent, sprout. ROOT RUBBLE: slabs swallowed by roots/moss. DISTANT BUTTRESS: tapering spires recalling petrified trunks and cavern stone, dim blue silhouettes with sparse violet rim light. Elevated adventure-game view, grounded foot origin, original concept art to rebuild in native pixels, no humans/UI.

### Environment study

Create one wide 2D pixel-art environment concept for WILDBOUND: dark magically enchanted purple forest at twilight, elevated three-quarter top-down co-op adventure camera. Dense muted-purple grass; winding stone path branching toward a hollow stump and ivy-wrapped rune shrine; lilac lanterns; twisted living trees with broad violet canopies and dangling stars. A small running explorer creates LOW ROLLING CLOUDS at ankle/shin height: bright rounded billows, strong curling eddies on either side, conspicuous cleared trail closing behind. Mossy/softly buried prop bottoms, grass/fog wrapping bases. An OPEN reflective pool reveals an unseen indigo twilight sky, purple nebula ribbons, a spiral galaxy and stars, with recognizable upside-down tree, lantern and standing-stone reflections. Keep trees from covering the whole pool. Root-framed portal opens to a green surface forest. Restraint in magical pink/purple accents, pale lavender low clouds, broad chunky clusters, consistent game pixel scale, readable hero and shared atmosphere tint. No photorealism, HUD or dense microdetail.
