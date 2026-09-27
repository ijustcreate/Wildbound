# Wildbound — The Living Board

Latest build: **1.0.5 · Combat combos, jumping and temple tigers**.

Launch **Play Wildbound.cmd**, or **dist/1.0.5/Wildbound-win32-x64/Wildbound.exe**. Keep the entire packaged folder together. See [1.0.5 test instructions](RELEASE_REPORT_1.0.5.md) and [the complete implementation report](RELEASE_REPORT_0.9.0.md) for the Field Kit update and [the changelog](CHANGELOG.md) for subsequent fixes.

## Play

During a solo expedition started with keyboard/mouse, use the left stick or a controller button to take over the existing hero. To add a second player during the first round, press Start/Menu on an unused controller. In the lobby, any controller button still joins. Reconnecting a controller reclaims a disconnected hero.

Gather 1–6 local players. Press a controller button to join, or Enter for keyboard/mouse. Create or select a saved character, choose an environment and difficulty, then open the board. Strike the table to roll. The opening locks movement until the first event arrives. First-round rolls establish turn order. Creatures persist until defeated or trapped; the party shares exploration and XP.

Reach space 48, hold Interact near the table to seal the jungle, and collect the shared victory chest. Unclaimed loot is recovered into that chest. Strike the board again for a new expedition. Saved equipment, personal storage, coins, appearance and loadouts persist.

## Field Kit

Open **G / right-stick click**. This pauses the local expedition while you organize. **LB/RB changes tabs; D-pad/stick moves focus; left/right changes dropdowns; A selects; B closes.** The controller that opens the kit selects its own hero.

- **Trail:** objectives, board choices, expedition boons, party pings, safe regroup and the previous expedition's debrief.
- **Storage:** backpack, three named chests, shared stash and Recovery. Search by name, rarity or stat; filter categories; mark stacks and move them to the selected destination. Locks protect all copies of an item type from bulk transfers, selling and dropping. Save/equip three transactional loadouts. Set guest access to owner-only, deposit-only or shared.
- **Craft:** turn harvested sticks, logs, stone and fruit into arrows, traps, tonics and temporary barricades. Choose snare, bramble, lure or flash trap behavior.
- **Look:** eight views, animated poses, cosmetic editing, presets, party symbols, helmet visibility, owned cosmetic overrides, dyes, relic display and stowed weapons. Visual changes do not alter equipment stats or collision.
- **Settings:** UI scale, board size, event duration, performance diagnostics, current bindings, saving and character backup tools. Import adds new character IDs without replacing existing heroes. Recover previous save has an explicit in-game confirmation.

Creation supports curated looks, lockable randomization, color swatches, optional custom colors, hairstyle, face details, silhouette, gear preview and starter kits. Controllers can use suggested names or the letter selector; a keyboard can type directly.

## Default controls

| Action | Keyboard / mouse | Controller |
|---|---|---|
| Move / aim | WASD or arrows / mouse | Left / right stick |
| Attack; hold to charge | F / left click | A |
| Dodge | Space / right click | RT |
| Interact / revive | E | Y |
| Quick loot | Interact nearby | X |
| Trap | Q | L3 |
| Block | C | LT |
| Potion | H | RB |
| Backpack | I | Back |
| Storage portal | P | D-pad up |
| Board | B | LB |
| Field Kit | G | R3 |
| Pause | Escape | Start |

Gameplay button bindings can be changed in the existing settings screen; in-game world prompts and Field Kit list the current bindings. Inventory and menu navigation use their own consistent A/B/D-pad/shoulder controls.

## New expedition systems

Rolling under threat grants 2 gold. Dense encounters wait when the active party already faces too many creatures. Every third personal roll offers a supplies/challenge/bargain choice. At space 12, choose one temporary boon. Objectives alternate between clearing enemies, protecting a relic, exploring, rescuing an explorer, disrupting a ritual and surviving. Completion awards each player 10 gold. Forest stoneguard patrols and desert ember/wolf groups complement existing mixed encounters.

Hold Block + Interact while moving beside a downed ally to drag them. A nearby blocking ally reduces incoming damage. Snare captures; bramble slows an area; lure attracts nearby hunters; flash interrupts into a punishable recovery. Barricades block movement and shots and expire after 30 seconds.

## Development and validation

Run `npm start`, `npm test`, `npm run test:app`, and `npm run package`. Browser preview: `npm run dev`.

Desktop graphics acceleration is enabled by default. Pass `--software-rendering` for the fallback. Saves use serialized asynchronous temporary-file writes and validated backups. Save errors remain visible in the Field Kit status strip.

Developer smoke helpers are dynamically loaded only with `--smoke-test` or the explicit browser query `?tools=1`. The full-frame comparison harness is `scripts/benchmark-full.cjs`; its baseline requires the local pre-update backup. `scripts/verify-field.cjs` captures Field Kit views and a stress benchmark. These timings are offscreen measurements, not a guaranteed frame rate on every PC.

The release remains focused on local co-op. Existing direct-network transport is experimental and has not been certified for the new Field Kit systems. Physical controller hardware and long-session balancing still need hands-on playtesting.

## Art and compatibility

The existing workshop, frame importer, rig studio and custom assets remain supported. New objective props, trap markers, barricade icon, directional wearables and character details are pixel primitives shared with runtime rendering; no external asset service is required. See [the asset manifest](assets/FIELD_KIT_ASSETS.md) and [Player Animation](PLAYER_ANIMATION.md).

Old character/rig migrations remain. Pre-update source is in `test-output/pre-090`; historical instructions are in `docs/history/README-before-0.9.md`.
