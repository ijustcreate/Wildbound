# Wildbound 1.0.72 — accumulated build, UI, spiders and coast

## Scope

This local release includes the entire current checkout, not just the latest patches: the 1.0.67–1.0.71 inventory/TV/companion/rig/storage work, anaconda body/collision, shader quicksand, adaptive level music/SFX, controller settings/character creator, plus the subsequent banshee queen, winged enemies, imps, zombies, wildlife, biome board/background, event variety and Boundless work. See the adjacent dated handoffs for those subsystems. It is built from modified, uncommitted source; no GitHub push is part of this release request.

## Latest fixes

- Ordinary arrows are now the only ammunition. Removed the inventory selector, arrow variants and ice-arrow crafting. Existing starter/ice arrows convert to ordinary arrows, and old recipe stacks convert to 20 arrows each, across profiles, bags, chests, shared storage, overflow, buyback and restored ground loot. Other slots, sockets, prices and world anchors are preserved. Equipment quivers remain usable gear, with ordinary ammunition drawn automatically.
- Fresh beach maps seed ten small crabs on the shore and eight fish in deep water. Native pixel animation, bounded habitat movement and stable caught IDs use the existing ecosystem rather than adding combat actors. Added nine headland cliffs and twelve large rocks, with physical footprints that leave board/pier/arch routes open. Existing expeditions retain their scenery; start a new beach level for the added rocks.
- Either a genuinely empty bottle or an empty cage now works with a net in either hand, including accessible bag contents and fishing in water. Catching is atomic when the backpack is full; container identity survives stacking, splitting, storage and reload. Release/salvage returns the container actually used. A fish needs nearby deep water for release.
- Unified player-dialog chrome uses restrained parchment and green material fills instead of enlarged nine-slice center textures. Item slots retain native icons. Portrait rooms crop their atlas cell to the frame's aspect ratio rather than stretching the image. Short dialogs scroll when necessary rather than hiding controls.
- Equipped icons have a protected minimum render area and an icon/label horizontal arrangement on compact panels. A two-handed weapon appears in both hand slots; the linked slot is no longer marked empty. Kept the body-shaped equipment grid and one-row action toolbar. Tested empty selection, equip/drop with sockets and two/three simultaneous owner-routed controller panels.
- Native black spider and sandy tarantula have separate palettes, proportions, eight articulated legs, alternating tetrapod walking, bite/hurt/snared/death poses and eight facings. Tarantulas are slower, tougher enemies with their own appended encounter and matching juvenile hatch art. Web immunity/maintenance and old event indices are preserved. Stock old spider rig fields upgrade; edited palettes, positions, clips, painted bone views and layer ordering are retained. No shared authored file was overwritten.
- The lobby map table shows all seven map choices at once in two columns (three on short windows), with one reversible `Boundless: OFF/ON` toggle. Fresh games default to bounded; continuing an existing Boundless expedition still preserves its map mode. Map choice/focus remains owner-routed.

## Checks

- Full Node suite: **895 passed, zero failed**. Additional focused arrow/capture checks include actual salvage and container-preserving split/storage operations.
- Native Electron UI checks: inventory at six size/zoom combinations including 600×430; two/three controller panels; all eleven gear canvases contain pixels, including an occupied second hand; real equip/drop/sockets; no ammo selector.
- Native coast/spider/map harness: 11 checks, zero failures; real beach population, native Animator walk frames, two-tarantula encounter, all maps/toggle visible at four sizes down to 600×430 and owner-only navigation.
- Robot, victory and starter chest UI checks: full inventory/buyback grids, visible gold focus, real transactions and full-pack safety, compact victory navigation and independent starter withdrawal/deposit/restock.
- Start/+ settings harness: 69 synthetic owner-routing checks, zero renderer errors. Character creator harness covers controller labels, keyboard focus, 19 hair/8 face choices and live close-ups.
- Physical controller hardware and audible listening are not claimed by synthetic checks. Remaining render/build identity checks are recorded below after packaging.

## Build identity

Source HEAD: `edc664ea35a4c75710570680dca26c6e1387f658`; source dirty, normal save profile (no `--preview`). Target release directory: `dist/1.0.72/Wildbound-win32-x64`. Desktop shortcut must target this checkout's `Play Wildbound.cmd`, with no arguments. The launcher selects the version in package.json and verifies its manifest.
