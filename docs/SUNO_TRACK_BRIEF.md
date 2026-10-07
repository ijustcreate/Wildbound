# Wildbound matched calm/combat music brief

## Existing-asset audit and provisional routing

All 11 bundled MP3s decoded in isolated Electron on 2026-10-06. These are independent recordings, with no supplied stems, tempo/key labels, matched arrangements, or listening evidence. Assignments below use titles as mood hints, not verified audible judgments. In particular, “calm” is a routing role; none of these recordings has been confirmed mellow by listening. Existing CC0 effects remain separate from music licensing (see `assets/sfx/CREDITS.md`).

| Context | Fixed calm role | Contrasting combat companion |
| --- | --- | --- |
| Forest | Lanterns in the Glade | Beyond the Swinging Vines |
| Desert | The Forgotten Map | Under the Conductor's Blade |
| Ice | Tiptoe Through the Canopy | Triumph at the World’s Edge |
| Temple | Beyond the Ancient Gate | The Altar of Bone |
| House | Beneath the Timber Rafters | Beyond the Village Gate |
| TV | Beyond the Village Gate | Beyond the Swinging Vines |
| Lobby | Curious Groove | Under the Conductor's Blade (reserved; ordinary lobby has no hostile threat) |

Every companion is approximate. The ice choice is especially thematic guesswork: there is no explicitly ice-labelled recording. Custom selection replaces the calm role and retains a contrasting context companion; Random remains available. Existing saved custom/random preferences are honored. Fresh settings default to Adaptive.

Objective decode audit: stereo, 48 kHz for every track. Peak/RMS estimates sample every sixteenth PCM frame across both channels; these are **not** LUFS, true peak, tempo, genre, or listening analysis. Output: `test-output/adaptive-music-audit.json`, produced by `scripts/verify-adaptive-audio.cjs`.

| Track ID | Duration (s) | Sampled RMS (dBFS) |
| --- | ---: | ---: |
| curious-groove | 184.37 | -16.1 |
| village-gate | 172.59 | -14.3 |
| worlds-edge | 179.04 | -14.3 |
| swinging-vines | 180.17 | -14.4 |
| ancient-gate | 172.57 | -14.4 |
| under-the-conductors-blade | 180.66 | -14.3 |
| lanterns-in-the-glade | 181.47 | -14.3 |
| the-forgotten-map | 180.45 | -14.3 |
| beneath-the-timber-rafters | 64.52 | -14.3 |
| tiptoe-through-the-canopy | 180.72 | -14.3 |
| the-altar-of-bone | 107.49 | -14.3 |

All measured final one-second windows are below -74 dBFS; Rafters also has a very quiet first window (-54.8 dBFS). Most tracks share similar overall RMS and peaks near 0 dBFS. Lower runtime volume cannot make an energetic arrangement mellow. These facts suggest end fades and possible loop gaps, but do not establish their audible length. Independent durations, unverified keys/tempos and baked-in intros/outros prevent a claim of synchronized or seamless matched music. Current playback uses an unsynchronized gain crossfade, keeping both current tracks advancing through threat changes; it does not time-stretch or beat-align them.

## Suno production request

Create seven **instrumental, mellow exploration themes**, then create a combat arrangement from each approved theme using the same melodic motif, key, tempo, meter, bar count, harmonic changes and exact loop duration. Do not generate two unrelated songs and call them a pair. Deliver calm/combat versions labelled forest, desert, ice, temple, house, TV and lobby, plus BPM/key/bar count/loop markers and rights/provenance. Review matched structure after export; generative output may need manual arrangement and trimming.

- Forest: warm woodwinds, soft plucked strings, light hand percussion; combat adds lower drums and string motion.
- Desert: airy plucked strings, restrained frame drum and wide space; combat adds rhythmic low strings and hand percussion.
- Ice: sparse glassy bells, soft sustained strings and gentle pulses; combat adds crisp percussion and quicker subdivisions at the same BPM.
- Temple: quiet modal drone, low flute and delicate stone/metal tones; combat adds low drums and tense ostinato without changing the harmony grid.
- House: intimate acoustic strings and soft mallets; combat adds small percussion and quicker plucks, retaining the cozy theme.
- TV: playful, gentle retro synth/plucks; combat adds bass pulse and arcade percussion while retaining the motif.
- Lobby: welcoming acoustic/synth theme; companion is a restrained practice/action arrangement, reserved for future use.

Target 16 or 32 bars at a comfortable shared tempo for each pair; consistent start phase and total samples, no vocals, countdowns, long intros, ending stingers or baked-in fades. Calm should have sparse percussion and soft attacks; combat should add urgency through instrumentation and subdivisions rather than simply louder mastering. Allow headroom, match perceived loudness, and verify the loop joins and mid-phrase crossfades by listening. Preserve the existing volume, mute, preview and custom-choice controls when replacing assets. Update `LEVEL_MUSIC_PAIRS` in `src/music.mjs` only after the new files and rights are approved; do not imply any music is CC0 solely because the effects library is CC0.
