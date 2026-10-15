const { app, BrowserWindow } = require("electron"),
  fs = require("fs"),
  path = require("path");
const root = path.resolve(__dirname, ".."),
  out = path.join(root, "test-output/dreadmane-lion");
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
    await w.loadFile(path.join(root, "dreadmane-lion-test.html"));
    await w.webContents.executeJavaScript("window.dreadmaneTest.ready");
    await w.webContents.executeJavaScript(
      "window.dreadmaneTest.setPlaying(false)",
    );
    for (const [name, t] of [
      ["idle", 0],
      ["walk", 0.3],
      ["run", 0.19],
      ["claw_left", 0.43],
      ["roar", 0.88],
      ["death", 1.9],
      ["pounce", 0.55],
      ["sleep", 0.5],
    ]) {
      const png = await w.webContents.executeJavaScript(
        `window.dreadmaneTest.render(${JSON.stringify(name)},${t});document.querySelector('#views').toDataURL().split(',')[1]`,
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
