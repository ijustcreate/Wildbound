const { app, BrowserWindow } = require("electron"),
  path = require("node:path"),fs=require('node:fs');
const root = path.resolve(__dirname, "..");
// A separate review window can show revisions without replacing an open draft.
const review=process.argv.includes('--review');
app.setPath("userData", path.join(root, review ? "test-output/murk-wolf-review-profile" : "test-output/murk-wolf-play-profile"));
app.whenReady().then(async () => {
  const window = new BrowserWindow({
    show: false,
    width: 1500,
    height: 960,
    title: "Wildbound · Murk Wolf test",
    backgroundColor: "#18292b",
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  window.removeMenu();
  await window.loadFile(path.join(root, "murk-wolf-test.html"));
  await window.webContents.executeJavaScript('window.murkTest.ready');
  window.show();window.focus();
  fs.writeFileSync(path.join(root,'test-output/murk-wolf-launch.json'),JSON.stringify({ready:true,visible:window.isVisible(),title:window.getTitle()}));
});
app.on("window-all-closed", () => app.quit());
