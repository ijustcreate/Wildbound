# Playable lobby and house updates (1.0.6)

Press Enter or a controller button to join. Each player chooses or creates a
character in their own panel, then can walk around while others join. Interact
with the map table, difficulty totem, or dice tray to change expedition settings.
The tray shows the chosen dice count; the totem uses the Gentle, Adventure and
Wild artwork supplied for this release. Interact with the closed board and choose
Ready. Every joined player must be ready before the three-second countdown.
Changing settings, joining, disconnecting, or cancelling readiness stops it.

Lobby practice uses gameplay movement, animation, combos, charged attacks,
equipped bows/wands, jumps, dodges, shields, traps, bait and potions. It runs in a
separate simulation: practice does not spend saved inventory or change progress.
The selected character's equipment and supplies determine available actions.
Keyboard: WASD to move, F to attack (hold to charge), J to jump, Space to dodge,
C to block, Q for traps, H for potions, T for bait, E to interact. Controllers use
the configured gameplay action mappings. Default B jumps outside selection
panels; cancel readiness through the board prompt, or Escape on keyboard.

Beds, tables, desks, sofas, chairs, benches and counters have a Jumpable surface
tag in House Builder. Jump onto them to land on their surface; walking off drops
back to the floor. Bookcases, walls and closed doors remain solid.

Exterior house windows start with glass. A melee hit or projectile shatters the
pane; the breaking projectile stops there. Later shots pass through, while the
window continues to block characters. Broken glass is preserved in expedition
saves. Existing house designs receive these features when loaded.

See [live-diagnostics.md](live-diagnostics.md) for the local game-state reader.
