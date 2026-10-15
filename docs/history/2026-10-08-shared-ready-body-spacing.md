# 1.0.115 shared ready screen, close opening view and body spacing

- Replaced individual board prompts with one responsive party ready screen using difficulty and level art, a live roster and per-player confirmation. Controller bottom-face confirms; right-face backs out. Keyboard uses Enter and Escape.
- Added selected item name and description below the chest grid while preserving hover tooltips.
- Cropped the opening board scene closer to the table and party.
- Added post-movement body separation for living players and enemies, with terrain-aware displacement.
- Focused tests: enemy body separation, chest Electron UI, shared lobby Electron flow. Full suite and packaged build run by the desktop rebuild script.
- Source was already heavily modified before this task; no commit or push.
