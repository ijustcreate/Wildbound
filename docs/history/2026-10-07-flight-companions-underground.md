# Wing flight, grave pursuit, companions and underground presentation

The user reported high tucked legs during wing flight, fences blocking flyers, grave zombies standing at their spawn, erratic pet locomotion, a small differently scaled crypt view, and requested subtle underground sound reflections.

- Added an ordinary editable `wing_hover` clip on the shared humanoid rig. Following the user's final review, knees lift slightly and feet remain well below the hips. Default equipped wings have a small backward sweep so their membrane shows in both profile views. Ordinary jump clips, edited hover keys and authored wing joints remain intact. Missing hover clips are added during the normal rig upgrade.
- Wing hover clears house fences/gates and cemetery fences/gates after reaching 32 world pixels of elevation. Solid house walls still block flight. Native flying kinds are recognized consistently during movement, including bats, bees, wasps, tsetse, ravens and pelicans.
- Disturbed grave zombies remember their disturber as they emerge. Normal zombies retain a six-second last-seen position to navigate around obstacles when line of sight is lost; hidden players cannot be hit through obstacles. Front vision and rear-approach rules remain in use.
- Navigation checks a footprint-safe direct approach before falling back to the existing grid. This avoids stopping at a cell center before a pet's actual follow point. Pets follow a stable point beside/behind the owner, ease into it, and use walking/trotting at normal follow speeds. Bat attacks now advance through the dive animation instead of selecting its final key.
- Underground rooms use responsive larger canvases, the surface renderer's logical pixel convention and camera zoom, the same player/creature sizes and shared Animator, and surface movement speed. Crypt exploration, lighting, doors, combat and persistence remain in the existing room system.
- Underground SFX receive short low-pass-filtered reflections through one bounded shared Web Audio graph. Music, UI, storage/upper rooms and surface actors stay dry. Crypt enemy sounds carry room-local coordinates.

## Verification

95 focused existing tests and six new behavior regressions passed. New tests exercise real fence crossing, emergence/pursuit through the cemetery, stable follow positions for all five hunter pet types, hanging hover feet and custom-clip preservation.

Source Electron verification passed 104 pose samples and 320 pet gait samples across eight directions. Actual crypt UI checks passed at 1280×850, 900×600 and 600×420; the player size is 43, matching the surface. The real OfflineAudioContext rendered a quiet reflection tail (energy 0.01197); actual GameAudio routing kept surface/UI dry and enabled crypt SFX reflections. No renderer errors or rig mutation during drawing.

Review outputs: `test-output/wing-hover-eight-directions.png`, `flight-companion-eight-directions.png`, `mausoleum-expanded.png`, `mausoleum-panel.png`, `flight-crypt-report.json`.

## Desktop delivery

`scripts/rebuild-desktop.ps1` passed all 1,177 Node tests and 292 runtime syntax checks. Build **1.0.92-flight-crypt** was packaged at **2026-10-07T18:38:13.206Z** from **bc1b432d20f4b0de0b04d4d3b34600f7a9fe0a70**, with modified source. Final packaged verification byte-matched 21 runtime/authored files, passed the 104 pose and 320 gait samples, responsive/co-op underground views, actual underground movement and Web Audio routing, with zero renderer errors. Packaged inventory selection/rotation geometry and creator input/close-ups passed at three window sizes.

Executable: `dist/1.0.92-flight-crypt/Wildbound-win32-x64/Wildbound.exe`. Desktop shortcut: `Wildbound Latest (1.0.92-flight-crypt).lnk`, targeting the repository's `Play Wildbound.cmd` with no preview argument. `Play Wildbound.cmd --check` confirmed this exact build identity. Use the normal save profile. Automated test windows were muted; no physical-controller or live audio listening test is claimed.

No commit, push, website deployment, profile replacement or running-game termination was performed.
