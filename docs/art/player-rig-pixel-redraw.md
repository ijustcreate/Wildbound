# Player and worn gear redraw

## Art brief

The approved reference is the user's eight-direction humanoid sheet attached in Codex on 2026-11-23. Keep its compact, friendly proportions: a broad cheek-and-jaw silhouette, short neck hidden by the collar, relaxed shoulders, a sturdy waist, connected thighs, and large simple shoes. Use the existing eight-view rig and joint attachments. Skin, hair, clothing dye, item identity, and custom wearable overrides stay live.

Construct silhouettes first, then one broad light plane and one broad shadow plane. Use warm dark outlines, four useful values per material, stepped contours, and one or two item-specific marks. Keep hair in broad locks with one crown highlight. Avoid tiny seams, repeated horizontal cloth bands, grain, dithering, or bevels. Rear views and mirrored facings must preserve the item's actual facing and handedness.

## Compiled head sprite

`player-head.pixel.json` is the authored, indexed 24×20 head silhouette in eight independent views. The face, hair, facial hair, and headwear remain separate renderer layers. Runtime colors map the four skin ramp entries to each character's skin palette while the outline stays warm and dark.

Regenerate the native pipeline output and compiled runtime module with:

```powershell
node scripts/pixel-art.mjs docs/art/player-head.pixel.json --out test-output/player-head-pixel-art
node scripts/compile-pixel-frames.mjs test-output/player-head-pixel-art/animation.json src/player-head-pixels.mjs PLAYER_HEAD_PIXELS
```

## Shared wearable treatment

The live gear catalog is redrawn through its shared part renderers so all worn head, chest, pants, glove, boot, shoulder, cape, neck, back, and shield items retain their definitions while using consistent silhouettes and value grouping. Shield silhouettes stay distinct by family: rounded buckler, tapered kite, squared tower, carved Waykeeper, and broad Bastion. Hair contours remain authored per hairstyle and direction; the shared shading uses broad warm clusters rather than strand noise.

## Review state

The recipe and compiled head are draft art until the assembled character is reviewed at gameplay scale. Review should include all eight idle facings, movement, equipped shields, a robe, plate, and exposed hair silhouettes, including rear hair and headwear occlusion. Pixel-art pipeline output alone does not confirm rig fit.
