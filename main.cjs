const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
let window;
const testOutput = path.join(
  app.isPackaged ? path.dirname(app.getPath("exe")) : __dirname,
  "test-output",
);
if (process.argv.includes("--software-rendering"))
  app.disableHardwareAcceleration();
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-background-timer-throttling");
if (process.argv.includes("--smoke-test"))
  app.setPath("userData", path.join(testOutput, "profile"));
app.whenReady().then(async () => {
  window = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 1000,
    minHeight: 700,
    show: false,
    backgroundColor: "#101e1b",
    title: "Wildbound • The Living Board",
    autoHideMenuBar: true,
    webPreferences: {
      additionalArguments: process.argv.includes("--smoke-test")
        ? ["--wildbound-test"]
        : [],
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
      offscreen: process.argv.includes("--smoke-test"),
    },
  });
  window.once("ready-to-show", () => {
    if (!process.argv.includes("--smoke-test")) window.show();
  });
  if (process.argv.includes("--smoke-test"))
    window.webContents.setAudioMuted(true);
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith("file://")) event.preventDefault();
  });
  ipcMain.handle("fullscreen", () => {
    window.setFullScreen(!window.isFullScreen());
    return window.isFullScreen();
  });
  const profilePath = path.join(app.getPath("userData"), "characters-v1.json");
  const sessionPath = path.join(app.getPath("userData"), "expedition-v1.json");
  const store = require("./save-store.cjs");
  ipcMain.handle("session-load", () => store.read(sessionPath, "session"));
  ipcMain.handle("session-save", (_e, data) =>
    store.write(sessionPath, data, "session"),
  );
  const houseDesignPath = path.join(app.getPath('userData'),'house-designs-v1.json');
  ipcMain.handle('house-designs-load',()=>store.read(houseDesignPath,'house'));
  ipcMain.handle('house-designs-save',(_e,data)=>store.write(houseDesignPath,data,'house'));
  const { RoomTransport } = require("./network.cjs");
  const room = new RoomTransport((data) => {
    if (!window.isDestroyed()) window.webContents.send("room-event", data);
  });
  ipcMain.handle("room-host", () => room.host());
  ipcMain.handle("room-join", (_e, address, name) => room.join(address, name));
  ipcMain.on("room-send", (_e, data) => room.send(data));
  ipcMain.handle("room-stop", () => room.stop());
  app.on("before-quit", () => room.stop());
  ipcMain.handle("profiles-load", () => store.read(profilePath, "profiles"));
  ipcMain.handle("profiles-save", (_e, data) =>
    store.write(profilePath, data, "profiles"),
  );
  ipcMain.handle("restore-backup", async () => {
    await store.restore(profilePath, "profiles");
    try {
      await store.restore(sessionPath, "session");
    } catch {}
    return true;
  });
  await window.loadFile("index.html");
  if (process.argv.includes("--smoke-test"))
    await require("./scripts/smoke-runner.cjs")({ window, testOutput, app });
  else window.show();
});
app.on("window-all-closed", () => app.quit());
