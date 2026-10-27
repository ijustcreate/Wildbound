# 2026-10-26 — current web edition and preserved original

User requested separate access to the old GitHub Pages game and a current web build, plus current source and GitHub information.

## Source and preservation

Checkout: C:/Users/New User/Desktop/Wildbound, branch Wildbound_worlds, starting at 1bd5ef027966e371f21cd0956b96b0aa4a62144b with extensive pre-existing uncommitted game/editor changes. This assignment publishes that current source, intended shared rigs, assets, tests and handoff notes. No personal profiles, saves, dependencies or generated desktop packages are source changes.

Previous Pages commit: 68c739c03499648f686f44ceb73508f62fb0808e. Its root game is copied unchanged to original/. Existing root runtime assets and releases/1.0.74 remain intact. A version chooser replaces only the root index. latest/ redirects to releases/1.2.55/. Future releases must preserve original/ and existing version folders.

Remote main at inspection: c306d7696cef44478f23db1d0c7478ac7623ed47. It contains the independent character viewer Site project. Preserve its main-only source and database integration while making the current desktop game authoritative at repository root. Original viewer instructions are retained in docs/CHARACTER_VIEWER.md. This assignment does not republish or migrate that Site.

## Web changes

- Build includes world manifests as well as modules, runtime assets and authored rigs.
- Published current builds load src/web-storage.js before game code. Their wildbound-current: key namespace cannot overwrite the original edition's keys. Future current builds reuse the namespace. No player save migration occurs. Both namespaces still share the origin's storage quota and clearing site data removes both.
- The source Electron index is unchanged by the publishing shim. Desktop saves and sound preferences are untouched.
- README and BROWSER-PLAY describe the game, workshop, experimental tools, capabilities, save boundaries and edition links.
- assemble-web-pages.cjs refuses to overwrite release snapshots; verify-web-pages.cjs uses a temporary isolated Electron profile and mutes its window before loading.

## Verification

All 1,512 existing Node tests passed (test-output/web-publish-tests.log). The new storage regression adds one passing test covering original-save protection, reload, scoped enumeration and scoped clearing. Build syntax check passed 406 runtime files. Diff whitespace check passes.

Muted HTTP-served Electron verification: chooser links, latest redirect, full asset initialization, Workshop, Worlds, actual Game update/Renderer draw, current-save reload, original-save preservation and boot of both original and 1.0.74. Report: test-output/web-pages/report.json, zero renderer errors. 428 original runtime files and the application match the pre-existing root byte for byte. No physical-controller, mobile, multiplayer or sustained FPS claim.

Web output: dist/web-1.2.55/. Published copy: dist/pages-publish/releases/1.2.55/. web-build.json records its actual modified-source baseline at 1bd5ef0; the final published source commit is recorded separately after integration. No desktop rebuild was requested. Play Wildbound.cmd --check still selects dist/1.2.55-2026-10-22T22-20-14-817Z/Wildbound-win32-x64/Wildbound.exe, built from modified source at 1bd5ef0 on 2026-10-22, normal save profile. This web deployment does not update that executable.

## Remaining limits

Development build; cold-region and heavy-encounter hitches remain as recorded in the October 22 handoff. Experimental swamp artwork remains review-only. GitHub Pages deployment and live endpoint checks must be verified separately from source pushes; see subsequent publication receipt.
