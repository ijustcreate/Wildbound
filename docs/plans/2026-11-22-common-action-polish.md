# Wildbound Common Action Polish Plan

Prepared for Felix on November 22 2026

Status: Implementation in progress. The first pass and remaining work are tracked in the [common action audit](2026-11-22-common-action-audit.md). Sections below describe the full intended scope; they are not a claim that every item is implemented or verified.

## The experience we are building

I will make an ordinary Wildbound session feel dependable from character selection through exploration, combat, inventory management, returning home and quitting. Players should understand what they can do, which object an action will affect, whether it worked, what changed and how to continue when something goes wrong.

The work will connect the systems Wildbound already has. Its native pixel artwork, shared screen co-op, playful interactions, controller mappings, authored rigs and existing saves remain the foundation. The first milestone is a complete, polished route through the game; the final milestone applies the same rules to every common action and supported context.

The governing rule is: **Every deliberate action receives an understandable result.** Success changes the game and acknowledges that change. An unavailable action explains the relevant reason. A failure leaves the player able to recover. Holding a button, closing a menu or reconnecting a controller must not accidentally perform an unrelated action.

## What I will cover

The action inventory will include joining and selecting a character; continuing a world; moving, jumping and swimming; targeting and interacting; collecting and carrying items; equipping and consuming items; attacking, taking damage and healing; opening chests and shops; entering houses, storage, vehicles and trains; traveling; pausing; saving; quitting; resuming; and recovering from blocked movement or disconnected input.

The audit will cover the playable lobby, connected Wildbound worlds, Classic expeditions and Boundless worlds. A feature may have different rules in these modes, but the game must explain the difference. Private player panels, shared dialogs, shops, storage, board controls and editor entry or exit are included wherever they intersect ordinary play. Specialist editor authoring workflows can receive a separate pass.

This pass does not require new quests, biomes, equipment balance or a replacement interface theme. Any change to damage, recovery costs, pause rules or progression is a deliberate design decision recorded separately from presentation fixes.

## Current foundations

The inspected checkout is `C:/Users/New User/Desktop/Wildbound`, on `Wildbound_worlds`, with origin `https://github.com/ijustcreate/Wildbound.git`. At inspection, `package.json` reports version `1.2.106`. The working tree contains extensive existing changes, so that version alone does not establish the identity of a packaged executable.

Useful foundations already exist:

- `src/controls.mjs` resolves mappings and controller family labels. `src/controller-glyphs.mjs` supplies controller artwork.
- `src/menu-navigation.mjs` provides spatial navigation. `src/expedition-menu.mjs` already handles visible selection, scrolling and several focus transitions.
- `src/car-prompts.mjs` demonstrates context dependent entry and exit wording. Train passenger work demonstrates selecting reachable overlapping targets.
- `src/enemy-damage.mjs` provides damage handling and hit feedback; `src/gameplay-fx.mjs` supplies reusable effects.
- `save-store.cjs` validates saves, serializes writes per file, writes temporary files and retains a backup. `world-store.cjs` has a separate named world snapshot path.
- `main.cjs` attempts to flush the local world before closing and keeps the game open if that operation fails. `src/worlds-ui.mjs` already exposes saving and save errors.

These are starting points to audit and extend. Their presence does not establish that every gameplay path uses them consistently. In particular, writes serialized within individual files do not by themselves establish consistency between world, character and house records.

## First establish the action audit

Before changing behavior, I will follow the ordinary session route and create a coverage sheet. Each row records the context, player, action, expected target, prompt, successful result, unavailable result, persistence requirement and verification evidence.

For example, collecting a train passenger's gift has several distinct outcomes: it enters the correct player's bag; the bag is full; the gift has already been claimed; another nearby passenger is selected; or the player leaves range before confirming. Each outcome needs an intentional response.

Each issue will include exact reproduction steps, the observed result, the desired result and a severity. I will inspect renderer exceptions and live diagnostics before treating an apparent control failure as a mapping problem.

| Priority | Meaning | Examples |
| --- | --- | --- |
| P0 | Player data or progression is at risk | Lost inventory, duplicated rewards, falsely reported saves |
| P1 | A normal session can become blocked | Trapped menu focus, unreachable required interaction, no recovery route |
| P2 | The player must guess what happened | Incorrect prompt, silent full bag, unclear blocked attack |
| P3 | The result works but lacks finish | Uneven spacing, excessive notification overlap, inconsistent transitions |

P0 and P1 fixes take priority. P2 issues in frequent actions follow. Cosmetic refinements come after the underlying result is dependable.

## Consistent interaction prompts

### What the player will see

Nearby usable objects receive one readable prompt with the actual input, a short verb and enough information to identify the target. Examples include `Open chest`, `Talk to Agnes`, `Catch apple`, `Enter car`, `Exit train` and `Return to house`. The button or key is generated from the relevant player's effective binding and input device.

A deliberately attempted unavailable interaction provides a useful reason such as `Bag full`, `Already claimed`, `Stop to exit` or `Move closer`. Distant scenery does not produce a wall of error messages.

### How I will implement it

I will separate choosing an interaction from drawing its prompt. A shared interaction result will describe the player, stable target identity, action, availability, reason and input. The visible prompt and the action handler will use that same result, with a final validity check when the button is pressed.

The selector will preserve intentional feature priorities, such as an unclaimed gift before repeat conversation. It will account for room, reachable distance, facing where relevant and intervening geometry. It will retain a target briefly while candidates are nearly equal, so tiny movements do not make the prompt flicker. Crowded groups will use a consistent selection or cycling rule rather than permanently hiding a target behind its neighbor.

I will adapt existing feature selectors incrementally. Cars, passengers, chests and portals will keep their specific eligibility rules while sharing prompt formatting, input resolution and result reporting. I will avoid rebuilding the whole interaction system in one change.

Prompts will fit the viewport, remain legible over grass, snow and dark interiors, and sit above decorative effects. Co-op prompts will identify the relevant player where ownership would otherwise be ambiguous. Two players using different controller families must see their own labels.

### Acceptance criteria

- The prompted object is the object acted on, or a changed situation produces a clear refusal.
- A player can reach every intended nearby target in an overlapping group.
- Remapped controls, keyboard input and controller family labels remain accurate.
- A prompt cannot promise access through a wall or from the wrong room.
- Important text remains readable in small windows and shared screen views.
- Button presses used to dismiss a dialog do not also interact with the world behind it.

## Clear pickup and transaction feedback

### What the player will see

Collecting something produces a small acknowledgment near that player and a visible inventory or currency change. Routine messages use item names and quantities, such as `Apple +2` or `Coins +3`. Important finds can receive a longer acknowledgment without stopping movement unnecessarily.

Repeated pickups of the same kind combine briefly into one message. Two players collecting simultaneously receive distinct feedback. Failed collection says why and leaves the item or reward available according to its existing rules.

### How I will implement it

Feedback will originate from the successful transaction, after the actual inventory or ownership mutation. Touching a pickup, starting an animation or requesting a purchase is not sufficient evidence of success.

I will audit loose loot, reward chests, gifts, shop purchases, captured creatures, consumables and storage transfers. For each, the code must determine capacity and eligibility, commit the transfer once and then emit the result. If only part of a stack fits, the accepted and remaining quantities must be explicit. If a feature requires all or nothing, its refusal must preserve the complete reward.

The acknowledgment will carry player ownership, item identity and quantity. A bounded display queue will merge routine messages and prioritize failures or important rewards. Sound and optional controller vibration can reinforce the result, but the visual acknowledgment must work with sound disabled and without vibration support.

### Acceptance criteria

- A displayed quantity equals the actual change for the correct player.
- Full bags, insufficient currency and invalid item use have understandable results.
- Rapid input cannot purchase twice, claim a gift twice or consume an item twice.
- Closing a panel or saving during a transfer cannot duplicate or erase the transfer.
- Repeated minor pickups remain readable without covering the player or filling the HUD.
- Reloading preserves finite rewards and consumed quantities according to each mode's rules.

## Readable combat and player condition

### What the player will see

A successful strike has a restrained impact response anchored to the contact. Taking damage clearly identifies the affected player, changes the health display and communicates the immediate danger. Healing reads differently from damage. Blocks, invulnerability and invalid attacks have their own result where the distinction is useful.

The scene must remain readable during a fight. Charged attacks, enemy warnings, loot, weather and damage feedback will have an explicit visual priority. Enemy windups and player health take precedence over decorative effects.

### How I will implement it

I will audit melee, charged sword releases, projectiles, magic, damage over time and environmental hazards. Feedback must follow resolved damage after defenses and immunity. Numbers, if displayed, will represent the documented result rather than raw requested damage. Continuous damage will use bounded aggregation instead of a new number every simulation tick.

Existing hit flashes, effects and practice target combat text will be reviewed before adding another layer. I will unify repeated paths where that reduces contradictory results. I will preserve attack timing and damage balance unless a separately recorded defect requires a gameplay correction.

I will tune health readability, short damage previews, healing feedback, status duration and low health warnings. Status meaning must use text or shape as well as color. Any screen shake, flash or vibration added will be restrained, adjustable or removable, and appropriate for a shared screen where another player may be uninvolved.

Action failures such as no arrows, unavailable potion, cooldown or insufficient resource will provide concise feedback after a deliberate attempt. Held input will not spam the same refusal every frame.

### Acceptance criteria

- A player can distinguish a hit, a block, healing and an unavailable action during ordinary play.
- Displayed damage agrees with resolved health changes, including overkill and immunity rules.
- Multiple attackers and repeated effects do not obscure enemy warnings or player health.
- Player feedback remains attributable in co-op.
- Disabling optional effects preserves essential information.
- Combat feedback does not introduce unbounded particles, text objects or growing queues.

## Responsive menus and reliable focus

### What the player will experience

Opening a panel immediately reveals its selection. Directional input follows the visible layout. The selected item remains visible when a list scrolls. Confirm performs one action; Back returns one level. Closing a panel restores control without an accidental attack, purchase or jump.

Empty slots, occupied slots, full bags and unavailable choices are deliberate states. A player can inspect useful explanations without being allowed to activate an invalid transaction.

### How I will implement it

I will audit the existing spatial navigation and feature specific navigation before consolidating shared behavior. Each panel will define initial focus, valid directional neighbors, selection after a mutation, Back behavior and the focus destination when it closes.

Focus should use stable item or control identity where possible. If a purchase removes a row, focus moves to its nearest valid neighbor. If a menu rerenders, the player's selection survives. Pointer and controller focus must coexist without an idle mouse stealing selection.

Input handling will distinguish a press from a held button. Navigation can repeat after a deliberate delay, while transaction buttons activate once per press. Opening and closing a panel will consume the transition input and require release where necessary. Trigger thresholds will avoid oscillating between pressed and released states.

I will explicitly define which player owns each panel and which panels affect the whole party. A shared pause, a private inventory and an active co-op world require different simulation rules. I will preserve current intentional behavior, make it visible and fix unsafe exceptions before considering changes to pause design.

### Acceptance criteria

- All ordinary menus are usable with a controller alone.
- Focus is visible after opening, resizing, changing tabs, buying, selling and deleting an item.
- Hidden, inert or removed controls cannot trap navigation.
- All relevant empty and occupied slot transitions work.
- Holding Confirm cannot cause repeated destructive or costly actions.
- Two simultaneous player panels retain separate selection and ownership.
- No gameplay input leaks through an open modal or its closing transition.

## Trustworthy saving and continuing

### What the player will see

Save feedback has four distinct states: changes waiting to save, saving, saved and failed. The pause or world panel shows the last completed save in plain language. Routine success stays quiet; a persistent failure remains visible with Retry and useful next steps.

`Saved` means the relevant persistence operation completed successfully. It must never be inferred from elapsed time or the absence of an exception in unrelated code. If progress changed during a write, the interface must not imply the newer changes were also saved.

### How I will implement it

First I will map the persistence boundaries for characters, expedition sessions, named worlds, house libraries and editor drafts. I will document which record owns each piece of progress and which mode uses each save path. I will trace normal autosave, explicit save, travel, return to lobby and window close separately.

I will build on existing temporary writes, validation, queues, backups and the close flush. Save requests will track the revision being written and the latest dirty revision. Repeated requests may coalesce, but changes made during an active write must schedule a subsequent save. A failed request must remain retryable.

Where an operation touches multiple records, I will test interrupted writes for duplicated or missing inventory and rewards. If those records can disagree, I will define one authoritative checkpoint or a recoverable revision protocol before changing the user facing success claim. Individually atomic files are not a complete multi-record transaction.

The default target is automatic saving at a bounded interval, with important committed changes requesting a save and transitions awaiting the appropriate flush. I will confirm the actual cadence by mode and measure serialization cost before increasing write frequency. Save operations must not add visible pauses to ordinary movement.

Save and Quit will await the required writes. A failure keeps the session open with Retry and Return to Game. Any explicit quit without saving route must explain the potential loss and cannot be the default selection. Forced process termination remains a separate crash recovery case; the game cannot promise to save after the process has been killed.

Loading will distinguish no save, incompatible save, damaged primary save and successful backup recovery. Existing files will be preserved before migration or recovery work. Backup recovery will identify the checkpoint restored so players understand any lost recent progress.

### Acceptance criteria

- Saved status follows the completion of the relevant write and revision.
- Immediate quit after pickup, purchase, equipment change or travel preserves completed progress when the save succeeds.
- Interrupted and failed writes retain a valid recoverable checkpoint.
- Failure tests cover denied writes, exhausted storage simulation, corrupt primary data, unavailable backup and overlapping requests.
- Named worlds, Classic sessions and Boundless state reload with their intended terrain, inventory, rewards and ownership.
- Normal and preview profiles remain separate and clearly identified during testing.
- Character, house and editor data are not replaced to resolve a world save problem.

## Recovery from getting stuck

### What the player will see

The pause menu will provide a clearly named recovery action such as `Move to safe ground`. It explains where the player will go and whether anything else changes. It is for movement failures such as being trapped in scenery, invalid support or an inaccessible exit.

Controller disconnection receives a separate message identifying the affected player. Reconnecting restores the correct assignment and requires buttons to return to neutral before play resumes.

### How I will implement it

I will add or extend a last known safe position using the current collision footprint, room, terrain, support and movement rules. A position is recorded after stable valid movement, never merely because a coordinate is inside the map. Water suitability must consider swimming capability. Vehicle and train positions require support identity because the platform may move.

Recovery will validate the destination again. It will search nearby valid support, then the last valid entrance or checkpoint in the same context, then an established safe spawn. The search is bounded. An unavailable fallback produces a useful error rather than silently moving the player to arbitrary coordinates.

The move will clear stale movement, dash and jump state, reconcile seats or carried relationships and restore camera follow. Inventory, health, loot, defeated enemies and world progress remain intact. It will never regenerate the map or reload an old save as a movement fix.

To limit use as a combat escape, the initial design permits recovery outside active combat with a short stationary hold and interruption on movement or damage. If combat flags themselves are stuck, a separate confirmed return to an established safe entrance must remain available. The exact fallback consequences will be recorded and tested; no hidden healing, reward reset or teleport shortcut will be introduced casually.

### Acceptance criteria

- Recovery handles solid overlap, unsupported elevation, blocked furniture and invalid room or vehicle placement.
- The chosen destination is valid when recovery executes.
- Recovery preserves progress and cannot duplicate carried objects or passengers.
- One player's recovery does not relocate the whole party.
- A disconnected controller cannot leave movement, attack or menu input held indefinitely.
- A bad combat flag cannot permanently disable the last recovery route.

## Shared presentation and accessibility rules

I will use the existing Wildbound visual language for prompt frames, selection, confirmations and warnings. A small set of shared text sizes, spacing rules and display priorities will reduce the sense that each feature has its own interface.

Important feedback must work with sound off, with reduced effects and without distinguishing colors alone. Controller labels must remain accurate for remapping and different families. Long item names must wrap or truncate with an accessible detail view. No essential explanation may require mouse hover.

Initial layout checks will cover 1280 by 720, 1920 by 1080 and a small 960 by 540 window, plus the actual minimum window size the desktop supports. These are proposed test sizes, not newly imposed minimum requirements. Co-op views and operating system scaling will be checked where they change the usable area.

Prompt state, selection and ordinary acknowledgments should update on the next rendered frame after the game accepts the input. I will measure event to visible response in the test harness and investigate outliers. Hardware latency and frame rate require separate measurement; simulation checks alone cannot establish either.

## Implementation sequence

| Stage | Work | Completion evidence |
| --- | --- | --- |
| 1 | Audit the full session and record failures | Action coverage sheet, reproduction cases and ranked backlog |
| 2 | Fix data risks and normal session blockers | Save and transaction regressions pass; essential menus and exits work |
| 3 | Finish one representative route | Prompt, pickup, combat, menu and save behavior agree along the route |
| 4 | Extend shared rules to remaining contexts | Every action inventory row has a verified result or explicit open issue |
| 5 | Add and verify recovery | Movement, input disconnect and save failure scenarios have usable exits |
| 6 | Run integrated desktop and hardware review | Exact package receipts, regression results and physical controller findings |

Within each stage I will make small, reversible changes and test the behavior affected. I will not claim completion because a shared helper exists while feature handlers still bypass it. New fixes that expose related failures return to the backlog and receive the same severity assessment.

The first representative route is: continue a world, walk to a chest, collect loot, equip it, fight an enemy, heal, enter storage, transfer an item, return home, save, quit and continue again. This crosses the systems most likely to disagree and produces a coherent early milestone.

## Full controller playtest

The full review is a repeatable session with recorded starting state. It will use isolated test profiles and fixtures. A physical controller pass is required to assess feel; automated Gamepad input is used for reproducibility and coverage.

| Step | Player actions | Required observations |
| --- | --- | --- |
| 1 | Launch the exact desktop build and join | Clear readiness, correct controller assignment, no repeated join from held input |
| 2 | Select a saved hero and continue a world | Correct profile, understandable selection, preserved equipment and progress |
| 3 | Move, aim, jump, swim and change rooms | Responsive transitions, correct support, no stranded input or camera |
| 4 | Approach overlapping interactable objects | Stable target, accurate prompt, every intended target reachable |
| 5 | Collect ordinary loot and claim a unique reward | Correct owner and quantity, restrained feedback, one-time reward stays finite |
| 6 | Fill the bag and attempt another pickup | Clear refusal or documented partial transfer, remaining item preserved |
| 7 | Open inventory, equip, consume and rearrange | Visible focus, correct quantities, sensible next selection, no input leakage |
| 8 | Fight with melee, charge, ranged and magic actions | Hits and failures distinguishable, warnings readable, health attributable |
| 9 | Take hazard damage and heal | Cause understandable, consumable committed once, clear recovery feedback |
| 10 | Shop with enough and insufficient currency | Cost and result clear, one purchase per press, refusal preserves state |
| 11 | Enter storage and move items between containers | Empty and occupied slots work, correct owner, no duplicates |
| 12 | Use a car, train, portal and house doorway | Correct entry or exit target, unavailable reasons, safe arrival and camera |
| 13 | Pause, change a setting, resize and resume | Focus retained, readable layout, intended pause behavior, no accidental attack |
| 14 | Disconnect and reconnect the controller | Correct player identified, neutral input on reconnect, reassignment usable |
| 15 | Trigger a controlled stuck case and recover | Valid destination, cleared movement state, unchanged possessions and world |
| 16 | Save and Quit immediately after a meaningful change | Required writes finish; no false saved state |
| 17 | Relaunch and inspect the world | Inventory, currency, finite rewards, terrain and relevant home state agree |

I will repeat the core route with keyboard and mouse, an available Xbox family controller and an available Nintendo family controller. Mixed-family labels and two simultaneous players will receive automated coverage even if matching physical hardware is unavailable. Two players will also test separate menus, simultaneous loot and different room transitions. Higher supported player counts receive layout and ownership checks appropriate to their limits.

If hardware is unavailable, the report will identify that exact gap. Automated input will not be described as physical controller playtesting.

## Automated and failure testing

Pure logic tests will cover target selection and invalidation, quantity and ownership, input edges, focus restoration, save revision tracking and safe position selection. These tests target actual failure modes rather than reproducing implementation details.

Muted Electron tests will exercise real input dispatch, rendered menus, transition state and save calls. Important scenarios include holding Confirm across panel transitions, removing the focused inventory row, changing an interaction target between display and press, collecting simultaneously and disconnecting during an action.

Persistence tests will use disposable directories and controlled failures. They will interrupt writes before and after temporary file replacement, test backups, retry failed queues and inspect consistency across related records. Tests will compare semantic world and character state, not just whether a load call returned an object.

Performance review will check crowded combat, pickup bursts, simultaneous panels and large world saves. I will record frame timing and save serialization cost against the same baseline scene and hardware. Presentation queues and effect counts must remain bounded. Any performance claim will identify what was measured.

All automated Electron windows will be muted before game load using `window.webContents.setAudioMuted(true)` or a test-only `--mute-audio` launch. Testing will not change the player's saved sound settings or Windows volume. A manual audio review, if needed, will be separate from silent automated testing.

## Repository and build safeguards

Before implementation I will recheck the repository root, branch, remote, dirty files, handoff and latest relevant history. The current tree contains work from other assignments. I will preserve it and avoid changing shared version or build state without accounting for that work.

Personal saves, house libraries and unfinished editor drafts will be backed up before any migration is exercised against them. Automated tests will use isolated profiles. Authored rigs and artwork will not be replaced for interface testing. Existing game processes will remain running unless the user authorizes stopping them.

Implementation verification will finish in Electron. The required desktop rebuild script will run its applicable tests, packaging and identity checks. `Play Wildbound.cmd --check` must select the exact reviewed package. Any cross-computer pull requires that check and a rebuild when identity is missing or mismatched.

If other chats are editing the same tree, I will record a reproducible source snapshot for package verification rather than claiming a package contains later changes. The delivery note will identify the Git commit, modified source status, package timestamp and path, launcher and shortcut target, and normal versus preview profile. The desktop shortcut must target `Play Wildbound.cmd` with the project icon. Commit, push, web deployment and release publication remain separate requested actions.

## Definition of finished

The pass is complete when every common action in the coverage sheet has a successful result, an intentional unavailable result where relevant, correct ownership, accurate input information and appropriate persistence coverage.

The ordinary session must be completable with a controller alone. Data loss, duplication, trapped essential menus and unrecoverable normal play blockers must have no open reproduction. Frequent actions must not silently fail. Save success must correspond to committed progress. The packaged desktop must pass the full route, with hardware review or an explicit outstanding hardware limitation.

The final evidence package will contain the completed action sheet, issue disposition, focused and broad test results, Electron observations, selected screenshots or short captures, save recovery results, exact build identity and a concise handoff note. Remaining aesthetic preferences, unavailable hardware and any deferred edge cases will be named individually. A document, a successful unit suite or an unreviewed package alone does not meet this completion standard.

## What the player should notice afterward

The player can tell which chest will open, sees what entered their bag, understands why an action was refused, navigates a menu without losing selection, recognizes damage and healing, trusts the saved indicator and can recover from a bad position. The same expectations hold when a second player joins or the session is continued the next day.

That consistency is the intended polish: Wildbound's existing activities become easier to understand, easier to trust and more satisfying to play through as one complete session.
