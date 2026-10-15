const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { createHash, randomUUID } = require("node:crypto");
let window;
const worldsSmoke=process.argv.includes('--worlds-smoke-test');
const bootSmoke = process.argv.includes('--boot-smoke-test')||worldsSmoke;
const testMode = bootSmoke || process.argv.includes('--smoke-test');
const preview = process.argv.includes('--preview');
if (preview) app.setPath('userData', path.join(app.getPath('appData'), 'Wildbound Night Hunt Preview'));
let releaseControllerClaims = () => {};
const testOutput = path.join(
  app.getAppPath().endsWith('.asar') ? path.dirname(app.getAppPath()) : app.isPackaged ? path.dirname(app.getPath("exe")) : __dirname,
  "test-output",
);
if (process.argv.includes("--software-rendering"))
  app.disableHardwareAcceleration();
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-background-timer-throttling");
if (testMode)
  app.setPath("userData", path.join(testOutput, "profile"));
app.whenReady().then(async () => {
  const controllerClaimRoot = path.join(
    app.getPath("temp"),
    "wildbound-controller-claims",
  );
  fs.mkdirSync(controllerClaimRoot, { recursive: true });
  const controllerOwner = randomUUID();
  const ownedControllerClaims = new Set();
  const claimFile = (key) =>
    path.join(
      controllerClaimRoot,
      createHash("sha256").update(String(key)).digest("hex") + ".json",
    );
  const staleOwner = (record) => {
    if (!record?.pid || record.owner === controllerOwner) return false;
    try {
      process.kill(record.pid, 0);
      return false;
    } catch {
      return true;
    }
  };
  const releaseClaimFile = (file) => {
    try {
      const record = JSON.parse(fs.readFileSync(file, "utf8"));
      if (record.owner === controllerOwner) fs.unlinkSync(file);
    } catch {}
  };
  releaseControllerClaims = () => {
    for (const file of ownedControllerClaims) releaseClaimFile(file);
    ownedControllerClaims.clear();
  };
  ipcMain.handle("controller-claim", (_event, key) => {
    if (!key) return false;
    const file = claimFile(key);
    const record = JSON.stringify({ owner: controllerOwner, pid: process.pid, key });
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const fd = fs.openSync(file, "wx");
        fs.writeFileSync(fd, record);
        fs.closeSync(fd);
        ownedControllerClaims.add(file);
        return true;
      } catch (error) {
        if (error.code !== "EEXIST") return false;
        try {
          const existing = JSON.parse(fs.readFileSync(file, "utf8"));
          if (existing.owner === controllerOwner) {
            ownedControllerClaims.add(file);
            return true;
          }
          if (!staleOwner(existing)) return false;
          fs.unlinkSync(file);
        } catch {
          return false;
        }
      }
    }
    return false;
  });
  ipcMain.handle("controller-release", (_event, key) => {
    if (!key) return false;
    const file = claimFile(key);
    releaseClaimFile(file);
    ownedControllerClaims.delete(file);
    return true;
  });
  window = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 1000,
    minHeight: 700,
    show: false,
    backgroundColor: "#101e1b",
    title: preview
      ? `Wildbound · Night Hunt Preview · v${app.getVersion()}`
      : `Wildbound Worlds · v${app.getVersion()}`,
    icon: path.join(__dirname, 'assets', 'wildbound-icon.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      additionalArguments: [`--wildbound-version=${app.getVersion()}`, ...(preview ? ["--preview"] : []), ...(testMode ? ["--wildbound-test"] : [])],
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
      offscreen: process.argv.includes("--smoke-test"),
    },
  });
  window.setMenuBarVisibility(false);
  const rendererLog = path.join(app.getPath("temp"), "wildbound-renderer.log");
  window.webContents.on("console-message", (_event, level, message, line, source) => {
    try { fs.appendFileSync(rendererLog, `[${new Date().toISOString()}] ${level} ${source}:${line} ${message}\n`); } catch {}
  });
  window.webContents.on("render-process-gone", (_event, details) => {
    try { fs.appendFileSync(rendererLog, `[${new Date().toISOString()}] renderer-gone ${JSON.stringify(details)}\n`); } catch {}
  });
  window.once("ready-to-show", () => {
    if (!testMode) window.show();
  });
  window.on('page-title-updated', event => { if(preview)event.preventDefault(); });
  if (testMode)
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
  if(!process.argv.includes('--no-live-diagnostics')){
    const diagnostics=require('./live-diagnostics.cjs').createDiagnostics(app.getPath('userData'));
    let lastReport=0;
    ipcMain.on('live-diagnostics',(event,data)=>{
      if(event.sender!==window.webContents||Date.now()-lastReport<200)return;
      lastReport=Date.now();diagnostics.publish(data);
    });
    app.on('will-quit',()=>diagnostics.close());
  }
  const rigStore = require('./project-rig-store.cjs').createRigStore({
    appPath: app.getAppPath(), exePath: app.getPath('exe'),
    userData: app.getPath('userData'), packaged: app.isPackaged,
    testMode,
    isolated: preview,
  });
  ipcMain.handle('project-rigs-load', () => rigStore.load());
  ipcMain.handle('project-rigs-save', (_e, data) => rigStore.save(data));
  ipcMain.handle("session-load", () => store.read(sessionPath, "session"));
  ipcMain.handle("session-save", (_e, data) =>
    store.write(sessionPath, data, "session"),
  );
  const worldStore=require('./world-store.cjs').createWorldStore(path.join(app.getPath('userData'),'Worlds'));
  const packStore=require('./pack-store.cjs').createPackStore({appPath:app.getAppPath(),userData:app.getPath('userData')});
  ipcMain.handle('worlds-list',()=>worldStore.list());
  ipcMain.handle('worlds-load',(_e,id)=>worldStore.load(id));
  ipcMain.handle('worlds-save',(_e,record)=>worldStore.save(record));
  ipcMain.handle('worlds-folder',()=>shell.openPath(worldStore.root));
  ipcMain.handle('world-packs-list',()=>packStore.list());
  ipcMain.handle('world-pack-assets',(_e,id)=>packStore.assets(id));
  ipcMain.handle('world-packs-import',async()=>{
    const result=await dialog.showOpenDialog(window,{title:'Install a local world pack',filters:[{name:'World pack manifest',extensions:['json']}],properties:['openFile']});
    return result.canceled?null:packStore.install(result.filePaths[0]);
  });
  let closing=false;
  window.on('close',async event=>{
    if(closing||testMode)return;
    event.preventDefault();
    try{
      await window.webContents.executeJavaScript('window.wildboundFlushLocalWorld?.()');
      closing=true;window.close();
    }catch(error){
      await dialog.showMessageBox(window,{type:'error',title:'Your world could not be saved',message:'Wildbound stayed open so you can retry saving.',detail:error.message});
    }
  });
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
  app.on("before-quit", () => {
    releaseControllerClaims();
    room.stop();
  });
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
  if(worldsSmoke)
    await require('./scripts/verify-worlds-desktop.cjs')({window,testOutput,app});
  else if (bootSmoke)
    await require('./scripts/boot-smoke.cjs')({window,testOutput,app});
  else if (process.argv.includes("--smoke-test"))
    await require("./scripts/smoke-runner.cjs")({ window, testOutput, app });
  else window.show();
});
app.on("window-all-closed", () => app.quit());
