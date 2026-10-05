# House worlds prototype and lobby arrows — 1.0.50

Opt-in mouse button below lobby toggles a separate house-start mode. Completed dice totals 5/8 transport the whole party after the board reveal; house chooses temple (jungle), forest, ice or desert, outdoors returns to house. Other rolls retain normal events. Destination selection may repeat. Each location freezes its complete simulation and character state, including inventory/health/positions; those are restored independently, not carried back over the saved character state. Session snapshots include inactive worlds. No existing profile migration or Git push.

Lobby embedded arrow drawing now accepts every quiver arrow type, including starter arrows, rather than only the literal arrow item. This fixes invisible floor impacts.

Tests cover two-player travel, ignored totals, independent house/forest state and save/reload. Electron check covers boot, lobby button and house/ice return. Extended multiplayer hardware playtesting remains needed. Includes earlier unpushed bow improvements. Existing unrelated full app smoke failures are not addressed.
