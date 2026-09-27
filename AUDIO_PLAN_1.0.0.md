# Wildbound 1.0.0 audio implementation checklist

## Sound inventory (written before implementation)
- UI: focus/navigation, accept, back/cancel, invalid action, join/leave, ready, character selection/deletion confirmation, settings changes, editor placement/move/save/undo.
- Board and progression: board strike, dice roll/settle, event reveal, objective/level-up, victory, defeat, portal entry/exit.
- Every enemy family: spawn call, attack/telegraph, injury, death. Families: lion/white lion, panther/snow leopard, crocodile, boar, snake, bat, wasp/bee, beetle, vine, golem, monkey, skeleton/unarmed/boss, archer, skeleton wizard, dragon, rhino, spider/baby spider/egg. Custom creatures use their behavior family as fallback.
- Weapons: sword/knife swing and hit, heavy strike, bow release and arrow impact, shield block, wand/spell cast and impact, fire and ice attacks, projectile collision, banana throw.
- Player: surface footsteps (grass, wood, sand, snow/ice, water), dash, ice glide, injury, downed, revive, heal/potion, trap set/trigger, poison/burn warning.
- Loot/storage: equipment drop, resource drop, coin/XP pickup, item pickup, equip/unequip, consume, transfer/split stack, inventory open/close, chest/cache open, harvest/chop/mine and tree fall.
- World: door/gate open/close, snow/ice interaction, frost berries, spider egg hatch/web encounter, rain, blizzard wind, volcano/fire, water ambience and environment beds.
- Mixing: independent master/music/SFX/UI/ambience controls; mute, reduced dynamic-range mode, sound test, persistent settings, rate limits/voice limits, slight variation, positional attenuation/panning, ambient fades and music ducking.
- Music: original Curious Groove only in menu; random selection from the other four tracks on each expedition, avoid immediate repeats, preserve choice while pausing or opening UI.
- QA: asset decode/peak/duration checks, no missing cue assets, every creature has a family mapping, event-driven playback (no continuous attack spam), mute/volume persistence, clean packaged build and credits.

## Source plan
Use CC0 libraries from Kenney (RPG Audio, Impact Sounds, Interface Sounds) and OpenGameArt creature/weather recordings. Include source URLs, authors, license text, and any processing notes in assets/sfx/CREDITS.md. Use layered/pitched families where a bespoke species recording is unavailable; document this honestly.
