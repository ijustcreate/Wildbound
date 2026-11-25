# Moonveil Circle and the Cinder Wraith

Moonveil Circle lies southwest of Mossbell Hollow, off the Eastwood trail. It appears as a named destination on the Wilds map. The five runestones glow blue and pink around a Moonveil Cat. The cat uses the native Honey rig with an ivory coat, antlers, and a layered animated tail. It walks and rests around explorers. An injury makes it flee, and the ward confines only the cat.

Killing the cat blackens the ground at its death point. The glyphs shift through violet and red to ember orange as smoke rises. The Cinder Wraith starts as a small core with one emerging limb and is invulnerable while assembling. Six orange wisps can be shattered individually, shortening the surviving limbs and shrinking the core. The Wraith pursues explorers using the normal world collision. Its limbs fold through openings, and contact with its mature smoke deals damage. A core kill leaves three Dark Essence. Leaving and returning or reopening the expedition during the same game keeps the circle spent. A fresh game launch restores the cat and clears a previous Wilds summoning.

Normal Wildbound has a five percent chance on an eligible dice roll to draw **When the Smoke Walks** and summon the same Wraith. A living Wraith prevents duplicate board summons. The event is appended to the encounter roster so saved indices retain their meaning.

## Desktop 1.2.160

The Windows package is `dist/1.2.160/Wildbound-win32-x64/Wildbound.exe`. It was built from the modified `Wildbound_worlds` checkout at `a6cee9bc55ad12ed58df5c3d27b150449f31ef26`. The numbered shortcut uses the normal save profile and targets `Play Wildbound.cmd -BuildDirectory "dist\1.2.160\Wildbound-win32-x64"`. The regular launcher also selected 1.2.160 at handoff. Build 1.2.158 passed the same encounter checks. A concurrent package numbered 1.2.159 omitted Moonveil Circle, so the current checkout was packaged again.

The build syntax-checked 1,230 runtime files, and 24 runtime files matched the packaged copies. The exact executable passed its muted lobby boot check. The packaged Electron encounter verifier passed 31 checks, including both summon routes, the first limb, formation immunity, the closed and open doorway, and clearing a live saved Wraith on restart. Eighteen focused Node checks passed, including projectile alignment and smoke-link damage. The full repository run was interrupted by a concurrent forest-art edit. The scripted Electron run used an isolated profile and disabled terrain workers. Hardware-controller input and gameplay frame rates remain unverified.
