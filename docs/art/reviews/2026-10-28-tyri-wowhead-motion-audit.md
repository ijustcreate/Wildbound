# Tyri / Archangel donor-motion audit — 2026-10-28

## Donor identity and evidence

- Wowhead NPC **79181, Tyri**: [modelviewer page](https://www.wowhead.com/npc=79181/tyri#modelviewer).
- The project roster map resolves display **25900**, model **2864**, FileDataID **234866**. The inspected M2 is `test-output/wow-motion-audit/tyri/234866.m2`, SHA-256 `98539b54a7fb4f42533d912e4185a4880eeabbf6910fb7e99797a5bf31fcd7a9`.
- Its AFID table names six external animation payloads: `480421`, `480426`, `480419`, `480423`, `480424`, and `480425`. All six were fetched from Wowhead's public modelviewer CDN into the ignored audit folder.
- The M2 reader successfully inspected the model: **77 bones**, **16 sequence entries**, **12 unique after alias resolution**. Four existing modelviewer Stand captures are in `test-output/modelviewer-references/79181-tyri-browser-stand-{front,side,rear,opposite}.png`.
- Unambiguous standard animation IDs present: Stand `0` (sequence 0), Run `5` (sequence 1), Walk `4` (sequence 3), AttackUnarmed `16` (sequence 4), and Death `1` (sequence 15). The `5`/`143` entries alias; attack-related IDs `53`, `8`, and `10` also alias other sequences. Preserve these aliases if a converter is added.
- Sequence ID `69` is **SitGround**, not flight. IDs `99` and `100` are custom/unnamed in this parsed source; `100` has three variants. Their names were not inferred from motion alone.

## Why no runtime clips were imported

The inspected M2 carries no semantic bone names. Its weighted hierarchy has plausible paired wing chains around bones `10/13`, `20/23`, `28/29`, and `32/33`, with additional weighted feather branches among `34–53`; the four-view Stand images confirm four bright wing lobes. This is useful mapping evidence, but it does not establish which branches correspond to each articulated wing surface or how the source axes/pivots map to the native 3-joint wing per side. The human-body key-bone entries also require an explicit anatomical cross-check before retargeting to Wildbound's `archangel` rig.

There is no clearly identified Fly/Flight sequence among the model's 16 entries. Retargeting Run as the Archangel's airborne hover, or assigning the unnamed custom sequences as flight/strike without a labeled source preview, would make an unsupported claim and could create misleading motion. Therefore this audit adds **no runtime changes** and does **not** claim Tyri donor animation is integrated. The existing native Archangel motion remains in place.

## Reproduction and next step

Use `node C:\Users\New User\.codex\skills\wildbound-motion-transfer\scripts\inspect-wow-m2.cjs test-output/wow-motion-audit/tyri/234866.m2` after the six AFID payloads are present in the same folder. A safe follow-up needs named/verified source wing and body anchors plus viewer-observed labels for the custom actions; then import only confirmed clips, preserve native warning/recovery actions and compare all eight facings before routing.

No source art, runtime, saved rig, build, Git commit or push was changed for this audit. The existing desktop test build is unaffected.
