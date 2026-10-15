const { app, BrowserWindow } = require("electron"),
  path = require("node:path"),
  fs = require("node:fs");
const root = path.resolve(__dirname, "..");
// A separate review window can show revisions without replacing an open draft.
const review = process.argv.includes("--review");
const smoke = process.argv.includes("--smoke");
fs.mkdirSync(path.join(root,'test-output'),{recursive:true});
app.setPath(
  "userData",
  path.join(
    root,
    smoke ? 'test-output/dreadmane-lion-launch-check-profile' : review
      ? "test-output/dreadmane-lion-review-profile"
      : "test-output/dreadmane-lion-play-profile",
  ),
);
app.whenReady().then(async () => {
  const window = new BrowserWindow({
    show: false,
    width: 1500,
    height: 960,
    title: "Wildbound · Dreadmane Lion test",
    backgroundColor: "#18292b",
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  window.removeMenu();
  let pageReady=Promise.resolve();
  window.webContents.on("did-finish-load", () => {
    const fight=new URL(window.webContents.getURL()).pathname.endsWith("/index.html");
    pageReady=window.webContents.executeJavaScript(fight ?
      "window.wildboundBoot.ready.then(()=>window.showcase('dreadmane-fight'))" :
      'window.dreadmaneTest.ready');
    pageReady.catch(error=>console.error(error));
  });
  if (process.argv.includes("--fight"))
    await window.loadFile(path.join(root, "index.html"), {
      query: { tools: "1" },
    });
  else {
    await window.loadFile(path.join(root, "dreadmane-lion-test.html"));
  }
  const result=await pageReady;
  if(!smoke){window.show();window.focus();}
  fs.writeFileSync(
    path.join(root, "test-output/dreadmane-lion-launch.json"),
    JSON.stringify({
      ready: true,
      visible: window.isVisible(),
      title: window.getTitle(),
      result,
    }),
  );
  if(smoke){console.log(JSON.stringify({ready:true,result}));app.exit(0);}
}).catch(error=>{console.error(error);app.exit(1);});
app.on("window-all-closed", () => app.quit());
