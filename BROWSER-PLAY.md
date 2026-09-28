# Play Wildbound in a browser

Windows: double-click **Play Wildbound Browser.cmd**. The launcher starts a local server when needed and opens a fullscreen Chrome (or Edge) app window without tabs or an address bar. F11 toggles fullscreen and Alt+F4 closes the game. This is still the web edition, not the Electron executable.

Mac/Linux: with Node.js installed, run `node scripts/launch-browser.cjs` from the game folder. No npm install is needed for browser play.

The game runs at http://127.0.0.1:4173/ and the server is accessible only on this computer. Keep the same browser and address for your browser saves. Desktop app saves are separate; they are not deleted or automatically imported.

Play online with no Node.js setup at https://ijustcreate.github.io/Wildbound/ . GitHub Pages serves the gh-pages branch. Browser saves belong to the browser and site address; they are separate from localhost and Electron saves. Desktop-only LAN transport and native file features are not available in the browser edition.

Build a new web snapshot with `node scripts/build-web.cjs`. It checks JavaScript syntax and creates a timestamped dist/web-* folder containing only the game files. Publish that snapshot to the gh-pages branch to update the online version.
