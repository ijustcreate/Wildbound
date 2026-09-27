# Wildbound build launcher

This folder is the handoff point for a packaged Windows build. Put the packaged `Wildbound-win32-x64` folder beside `Launch Wildbound.cmd`, then double-click the launcher.

When this folder is inside the source repository, the launcher also checks `dist/1.0.5/Wildbound-win32-x64/Wildbound.exe` and the legacy `dist/Wildbound-win32-x64/Wildbound.exe` location.

To create the packaged folder locally:

```bash
npm install
npm run package
```

Keep the complete `Wildbound-win32-x64` folder together. The executable depends on the files beside it.
