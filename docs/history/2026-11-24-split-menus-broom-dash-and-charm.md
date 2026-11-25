# Split-screen menus, broom dash, and charmed creatures

- Player-owned menus cover the owning split camera pane. The split camera uses the full canvas and keeps the other players’ framing independent of open menus. Menus in a shared pane each get usable space, and the shared-screen layout resumes after regrouping.
- Brooms use the normal dash input in outdoor play and on the Quidditch pitch. Standard cooldown is 3 seconds. Nimbus reduces it to 2.7 seconds and Firebolt to 2.25 seconds. On the pitch, K or D-pad Down descends.
- When control switches to a charmed creature, the hero follows it and moves away if they overlap. The hero leaves more clearance around larger creatures, uses existing obstacle navigation, and resumes control at the hero’s current position.

## Verification

- Muted Electron source checks exercised split inventories and starter loot at 1280×800 and 640×640, including diagonal panes, independent controls, simultaneous menus, and regrouping. The camera, panel layout, and vending controller suites passed.
- The muted Electron Quidditch verifier covered the keyboard and simulated gamepad dash and descent. Targeted Node tests covered cooldowns, dismounting, and movement at the pitch boundary and in outdoor scenes.
- The muted Electron recovery and control verifier covered the charmed creature handoff, trailing movement, and restoration of the hero’s position and loadout. Targeted Node tests covered an overlapping handoff, larger creatures, obstacles, and return to the hero. Physical controller play remains unverified.

The changes were verified from modified source at `a6cee9bc55ad12ed58df5c3d27b150449f31ef26`. At handoff, `Play Wildbound.cmd --check` found normal-profile build `1.2.171`. The package predates the final compact menu styling and charmed-creature follow behavior.
