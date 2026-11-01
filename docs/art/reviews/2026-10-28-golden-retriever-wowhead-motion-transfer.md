# Golden Retriever Wowhead motion transfer

- Donor: Wowhead NPC 120973 Golden Retriever, M2 FileDataID 1599825 (`https://wow.zamimg.com/modelviewer/live/m2/1599825.m2`), SHA-256 `601f7105866a25569949cf3bd7d549b3b251ae1e079cd178a8c2e5aef6ec5f12`.
- Exact unique donor clips: Stand sequence 0 / animation ID 0 (3334 ms); Walk sequence 29 / animation ID 4 (800 ms); Run sequence 19 / animation ID 5 (666 ms). Each is sampled at 24 fps, normalized to the first pose, with root motion removed.
- Retargeting maps source pelvis/chest/head and four limb chains to the existing editable Wildbound quadruped rig. Tail, ears, and facial anchors follow the donor mapped bones. This is positional skeletal retargeting, not donor mesh skinning; native pixel art and native sit/wag/fetch/attack/hurt/death actions are retained.
- Grounding: sampled terminal paw pivot minimum is +0.032 source units (Stand), +0.03729 (Walk), and -0.00058 (Run). The run dip is negligible but documented; no artificial foot clamp was applied. Visual preview shows grounded contacts within the native rig's pixel scale.
- Muted Electron capture: `test-output/golden-retriever-wow-motion-transfer/capture.json` (all 8 facings × 4 phases; no renderer errors). Sheets: `idle-eight-facings.png`, `walk-eight-facings.png`, `run-eight-facings.png` in the same folder.
- Focused verification: `node --test tests/creature-packs/golden-retriever-wow-motion.test.mjs tests/creature-pack-animation-routing.test.mjs tests/creature-packs/wildlife-pack.test.mjs`.
- Reproduce generated clip data with `node scripts/import-golden-retriever-wow-motion.cjs`.
