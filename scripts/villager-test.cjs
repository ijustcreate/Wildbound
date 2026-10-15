const { app, BrowserWindow } = require("electron"),
  path = require("node:path");
const root = path.resolve(__dirname, "..");
app.setPath("userData", path.join(root, "test-output/villager-play-profile"));
app.commandLine.appendSwitch("mute-audio");
app.whenReady().then(async () => {
  const w = new BrowserWindow({
    show: false,
    width: 1450,
    height: 950,
    title: "Wildbound · April and villagers",
  });
  w.webContents.setAudioMuted(true);
  try {
    if (process.argv.includes("--camp")) {
      await w.loadFile(path.join(root, "index.html"), {
        query: { tools: "1" },
      });
      await w.webContents.executeJavaScript(
        "window.wildboundBoot.ready.then(()=>window.showcase('villager-camp'))",
      );
    } else await w.loadFile(path.join(root, "villager-test.html"));
    w.show();
    w.focus();
  } catch (error) {
    console.error(error);
    app.exit(1);
  }
});
app.on("window-all-closed", () => app.quit());
