# Mixed enemy group balance

Request: make mixed groups cooperate without all attacking at once, preserve fair tells/openings, and keep the floor clean.

## Behavior

`enemy-group-combat.mjs` provides shared attack admission across ordinary species, Crossfire roles, eldritch/construct controllers, wolves/panthers, humanoid casters, night enemies, captains/lions, wildlife combat, gorillas and spider contact. Individual controllers retain their native attacks, damage, tells, direction locks and recovery durations. Player damage/resources were not buffed to compensate.

One offensive turn is admitted per nearby player on the same floor. Separate co-op targets can have separate turns. Waiting ready enemies age in a queue so the first actor in an array cannot repeatedly steal the turn. Active reservations are released on death, restraint, target loss, range/floor departure or abandoned preparation. Older saves with an in-progress tell acquire a reservation without restarting or canceling their tell. The stored coordination data uses ids, clocks and navigation points, with no live actor references.

A melee handoff preserves at least .38 seconds after recovery starts; a rush preserves .52 seconds. Shots leave space for their actual travel speed/distance (up to 1.8 seconds). This is additional group admission spacing, not faster/slower animation sampling. Another enemy must still play its full tell. Connected attacks retain their own controller's action sequence.

One support channel can accompany an offensive turn; completed support channels are separated by 2.4 seconds. Healers remain interruptible and still validate mana, target health and range at resolution. This limits heal pile-ons rather than inventing extra healing. Autonomous swarms, spawners, persistent environmental hazards and enemy-versus-enemy ecology retain their separate existing behavior.

Waiting frontline enemies choose stable flank positions within their attack reach. Backline units hold a clear offset behind a same-group shield. This replaced a first attempt that caused perpetual orbiting and could starve an archer of a firing lane. Shield protection recognizes ordinary backline/support units as well as the original Crossfire archer. Existing navigation, wall collision, ally shot-lane checks and crowd steering remain authoritative.

No new floor effects were added. Waiting does not display an attack footprint. Existing native body tells and footprint art activate only when the controller actually enters its attack. Special construct windup capitalization and wildlife recovery phase adaptation were corrected so their tells/openings agree with their real state.

## Checks and limits

- Source Electron: four deterministic mixed setups (patrol, dual-support frontline, mixed creatures, two-player co-op), 20 checks pass with no renderer errors. Measures AI phases, offensive turn count, support count, danger-footprint count, idle opening frames and attacker rotation. Existing target/aim-lock, ammunition, status, capture and wall tests cover the individual attacks.
- The first unit integration caught archer starvation; stable formation points resolved it. A later contact regression found the separate spider route in expansion, which now also requests a turn. Legacy fallback contact is gated too.
- Initial broader run: 219 checks passed and six suites could not initialize because the then-current TV board-art import created cycles into core/rig registration. The shared checkout subsequently removed that eager board-renderer dependency and passed its renderer into TV art. This was a concurrent fix, not authored by this enemy pass. The six suites plus group/TV checks then passed 97 checks. Final boss rechecks passed 30.
- Final shared phase review found that a literal `active` phase was falling through to `approach`. The adapter now recognizes the committed swing/rush, and a dedicated regression holds the turn through that entire phase. This also activates the intended native active-clip sampling.
- Source contract/role tests passed 65 checks before the final semantic-phase regression; the complete coordinator suite then passed 12 including contact/ownership cases. The release run includes the new phase check and is recorded below.
- Spider/expansion regressions: 19/19. Gorilla/temple regressions: 8/8. Owned pets/allies are excluded even when represented by owner ids rather than an explicit ally faction.
- Final source contract/roster/role run: **67/67 pass**, including 13 coordination cases. The final semantic-phase check and ownership/contact cases are included.
- Final packaged release: **176/176 muted native checks**, no renderer errors: mixed groups 20, roster/eight-direction art/train warnings 105, sword polish 35, live Crossfire/shared pressure 16. Reports and screenshots are under each test-output category's `packaged-release-balance/` stage. Earlier native stages are superseded by this release stage.
- Measured in 27-second AI scenarios: solo patrol/support/creature groups each peak at one offensive phase; co-op peaks at two, one per target. Support channels peak at one. Patrol uses body tells and zero new floor footprints; the other solo setups peak at one danger footprint, co-op at two. All setups rotate attackers and retain idle opening frames.
- Native group simulation advances the AI directly and discards old projectiles; it is a scheduling/visual test, not an end-to-end projectile/DPS or human/controller playtest. The final visual overview expands vision in the isolated test process to inspect all formation members. Player saves and sight settings are unchanged. No FPS claim. No clean full repository-suite claim.

## Desktop and checkout

`Wildbound_worlds`, origin `https://github.com/ijustcreate/Wildbound.git`, commit `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5` plus extensive modified source. No commit/push. Existing authored rigs, personal saves, drafts and unrelated edits preserved. Authored rig hash observed: `280FBAC82256AA65C7CDFDEA14834913964003B2823B192E49566E629FE30A41`.

The canonical package passed **957 runtime syntax checks** and created **1.2.112** from modified source. Final gorilla admission, owned-ally exclusion and the semantic active-phase correction were synchronized into this newly created package after the canonical copy, with syntax/behavior checks and SHA-256 entries recorded in its `incrementalFiles` manifest. All release native checks ran after finalization.

Exact verified package: `dist/1.2.112-2026-11-23T18-56-01-206Z/Wildbound-win32-x64/`. Canonical packagedAt `2026-11-23T18:58:28.699Z`; finalized builtAt `2026-11-23T19:07:29.147850Z`. Manifest: base `f0b787ff33c3ac8f3675b48504937ebda4f0dcb5`, `sourceDirty: true`, `preview: false`. No commit or push.

Actual packaged EXE boot test exited **0**: ready lobby, Worlds available, zero renderer/boot errors, muted isolated test profile. Normal launcher `C:/Users/New User/Desktop/Wildbound/Play Wildbound.cmd --check` selects the exact package above. Desktop shortcut `C:/Users/New User/Desktop/Wildbound Worlds (1.2.112).lnk` targets that launcher, has blank arguments, repository working directory and `assets/wildbound-icon.ico`. Normal save profile; no `--preview`.

All **26 combat-pass runtime files** and authored rigs match the tested package. The broader final runtime comparison and any concurrent drift are recorded in `test-output/mixed-group-package-files.json`. This is the verified snapshot, not a promise to include subsequent concurrent edits.

Final runtime comparison: 957 files; differences: [].
