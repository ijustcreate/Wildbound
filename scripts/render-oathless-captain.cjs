const { app, BrowserWindow } = require("electron"),
  fs = require("fs"),
  path = require("path");
const root = path.resolve(__dirname, ".."),
  out = path.join(root, "test-output/oathless-captain");
app.disableHardwareAcceleration();
app.setPath("userData", path.join(out, "render-profile"));
app.whenReady().then(async () => {
  const w = new BrowserWindow({
    show: false,
    width: 1500,
    height: 980,
    webPreferences: { offscreen: true },
  });
  try {
    await w.loadFile(path.join(root, "oathless-captain-test.html"));
    await w.webContents.executeJavaScript("window.captainTest.ready");
    await w.webContents.executeJavaScript(
      "window.captainTest.setPlaying(false)",
    );
    for (const [name, t] of [
      ["idle", 0],
      ["walk", 0.3],
      ["run", 0.19],
      ["slash", 0.55],
      ["shield_bash", 0.43],
      ["death", 1.9],
      ["thrust", 0.42],
      ["salute", 0.9],
    ]) {
      const png = await w.webContents.executeJavaScript(
        `window.captainTest.render(${JSON.stringify(name)},${t});document.querySelector('#views').toDataURL().split(',')[1]`,
      );
      fs.writeFileSync(
        path.join(out, name + ".png"),
        Buffer.from(png, "base64"),
      );
    }
    console.log("Rendered eight Dreadmane contact sheets.");
    app.exit(0);
  } catch (error) {
    console.error(error);
    app.exit(1);
  }
});
