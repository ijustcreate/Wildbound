# Combat and encounter release pass

The six combat changes share the existing attack, movement, encounter, discovery and save systems.

1. **Contact feedback.** Sword cuts show a directional spark, shield contact plays the block or parry effect, and a wall slam uses debris, a low thud, and a longer pause. Camera impact falls off outside the current view and respects reduced motion. Studio can disable camera impact and combat pauses independently.
2. **Rush counters.** A newly raised frontal guard can catch a committed rush, including Dreadmane’s swept pounce. A clean miss opens a shorter window. A visible timer shows the opportunity and a direct heavy hit claims the bonus once. Existing attack admission and boss movement rules still apply.
3. **Boomerang positioning.** The returning blade follows the moving hand. Its dotted guide belongs to the thrower’s view. A shield can take a front chip and then a rear hit from the same throw. Solid cover still blocks damage and the boomerang remains in the explorer’s inventory.
4. **Elemental finishers.** Heavy melee still breaks ice into nearby shards. Fire bolts and flaming arrows can now break the ice at range with Thermal Shock, which deals bounded bonus damage and briefly interrupts ordinary foes. It preserves unrelated vine restraint. Bosses receive a smaller bonus.
5. **Encounter layouts.** Ember Clearing supports a solo campfire shot, Snare Pass offers a straight trap lane and a rear approach, and Shieldgate Ruins has cover, a flank and a backstop. These are regular forest board cards with persistent encounter scenery and supplies. Studio → Events can apply and preview the layouts. See [encounter design and checks](2026-11-23-combo-encounter-layouts.md).
6. **Co-op finishes.** Partners can claim a guard opening, finish each other’s ice setup, or launch an enemy into an ally’s trap. Both explorers receive the matching Field Kit discovery. On an existing LAN session, the host owns damage and credit. Clients receive countdown presentation data and can use stationary block or dodge input.

Studio → Combat provides draft values, repeatable previews and local save/reset controls for impact, counters, boomerangs, elemental finishers, and team callouts. Studio → Particles exposes the new cut, wall and thermal effect bindings. No rig or player profile was edited by this work.

## Verification

The focused combat suite passed 44 checks in its first integrated run. The encounter suite passed 43 focused checks and 28 muted Electron checks. The boomerang passed 44 related tests and 10 muted Electron checks. The Studio Combat tab passed 12 muted checks, including keyboard entry, local save/reset, runtime accessibility settings, editable particle bindings and the 650-pixel layout. Hardware controller feel, two-device LAN latency and long expedition balance require play outside these scripted checks.

The full snapshot sweep ran 2,267 tests and passed 2,259 on its first invocation. The eight failures led to a definition-pack migration fix, a Dev test-board terrain preview fix, distinct generated audio for the new cards, and updated fixtures for mixed-group pressure, guarded frost casts and manual scenario supplies. The affected files passed 87 checks in the first final rerun and 13 in a second. The original audio masters retain their hashes, and the audio catalog verifies a distinct, bounded PCM cue for each of the 170 event cards. The sweep and final scoped reruns are recorded separately under `test-output/combat-release`.

## Desktop release

The final package passed 981 runtime syntax checks. Its muted Electron checks passed for combat (20), boomerang steering (10), encounters (28), Studio (12), and Field Kit controller navigation (17), with zero renderer errors. The staged executable and its byte-verified normal-path copy both booted with isolated muted profiles. The stage and installed copies matched across the executable and 51 runtime and audio files.

`C:\Users\New User\Desktop\Wildbound Worlds (1.2.113).lnk` targets `C:\Users\New User\Desktop\Wildbound\Play Wildbound.cmd` with no arguments. The launcher verified and selected `C:\Users\New User\Desktop\Wildbound\dist\1.2.113-2026-11-23T19-46-41-349Z\Wildbound-win32-x64\Wildbound.exe`. The manifest records base commit `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5`, modified source, stamp `2026-11-23T19:47:04.261Z` and the normal profile. See `test-output/combat-release/desktop-release.json` for the launcher and test receipts. No commit or push.
