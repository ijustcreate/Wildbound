# Captured critters, stack limits and icon detail — 1.0.62

Using a captured creature releases a transient follower and returns its empty jar/cage. Followers are runtime-only: world reinitialization or quitting/restoring loses an unrecovered follower. Catcher nets recapture them through the existing inventory-capacity-safe transaction. Released frogs hop while following; other species use their existing animation. They do not flee from their owner.

Salvaging a captured creature destroys one passenger, drops one Dark Essence and its empty container at the player's feet, using the existing deliberate hold-to-salvage flow. Dark Essence currently has no gameplay use.

Existing stackable supplies plus captured creatures now cap at 999. Equipment, bags and other instance-bearing items retain their individual handling. Existing saved stacks are not discarded or forcibly rewritten.

Every existing item icon receives a cached 48px detail rendering with one-pixel highlight/shadow bevels, preserving its original authored silhouette. Inventory canvases now retain that resolution instead of downsampling to 24px. This is a procedural refinement, not a claim that 163 new detailed illustrations were hand-painted or generated. The full atlas and index are assets/item-icons-detail-v1.png/json; export-item-icons.cjs reproduces them.

Includes all 1.0.61 UI/boomerang/pause work and a tooltip-coordinate repair for the thicker nine-slice border. Normal Electron build remains based on modified HEAD 1891708d014594bd837f1a7049ecefa04d16dae4, with no commit/push requested. Physical controllers remain untested.

Verification: 615 Node tests pass; Electron inventory sizing is stable at heights 850/600/420, merchant and pause actions pass against the packaged ASAR, and packaged code/art hashes match the checkout. The broader packaged legacy smoke reports 16 failures (including old chest/backpack/merchant expectations, lobby portrait/roll checks and editor interactions), with a later Field Kit undefined-player error. These are unresolved; do not report a clean broad smoke. Build identity: 2026-10-05T21:52:33.683Z, sourceDirty true. Desktop shortcut: Wildbound Latest (1.0.62).lnk, targeting Play Wildbound.cmd with the normal profile.
