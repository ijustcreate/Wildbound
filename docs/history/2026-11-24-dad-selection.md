# Dad saved-character startup

In desktop 1.2.134, selecting Dad copied his saved owl state into the lobby practice actor. The generic quest update treated the owl’s active flag as a contract and threw before the next lobby draw. The same update runs during standard expeditions.

The quest update now reads visit progress only from records with a visit objective. Owl adoption, equipped items, personal chests, and saved quest records need no migration. The reproduction and verification use isolated copies of the normal desktop profile through Electron’s save IPC. The picker test uses simulated Xbox input.

Muted verification reproduced the failure in 1.2.134 and passed ten checks in packaged 1.2.136. Dad rendered and moved in the lobby, started both Classic and the Wild Lands, and retained his owl, backpack, equipped items, and personal chests. All 34 focused Node checks passed. Windows 1.2.136 was built from modified source at `a4514c06df1ad9d1efa6b8b1336454cda9bc3bca`. The normal-profile Desktop shortcut pins `Play Wildbound.cmd -BuildDirectory "dist\1.2.136\Wildbound-win32-x64"`.

## Combined build and compartment coach

On the standard 100-pixel-wide compartment coach, the longitudinal wall and its doors move from carriage-local Y 27 to Y 13. The walking lane gains 14 pixels, and the painted runner follows it. The crosswalls meet the new frontage. The sofas and tables keep their existing locations and IDs. Narrow coaches retain room to stand by each sofa. An older checkpoint overlapping the relocated wall moves the rider to nearby clear floor on restore. Authored interiors and older painted overrides keep their original geometry.

Windows 1.2.137 includes both fixes and was packaged from modified source at the same commit. All 55 focused Node checks passed, including door traversal, sofa exits at widths 100 and 86, restoration and student conversations. The muted executable boot smoke reached the lobby with zero errors. In muted Electron, the packaged coach blocked passage through a closed door, let the player through after opening it, and allowed the player to sit and stand. A repeat of the ten Dad checks passed against the exact packaged resources with simulated Xbox input. The normal-profile Desktop shortcut pins `Play Wildbound.cmd -BuildDirectory "dist\1.2.137\Wildbound-win32-x64"`.
