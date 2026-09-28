const { app, BrowserWindow } = require("electron");
const fs = require("node:fs"),
  path = require("node:path");
const root = path.resolve(__dirname, "..");
app.setPath("userData", path.join(root, "test-output", "field-profile"));
if (process.argv.includes("--software-rendering"))
  app.disableHardwareAcceleration();
app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false,
    width: 1440,
    height: 940,
    webPreferences: { offscreen: true },
  });
  const errors = [];
  win.webContents.on("console-message", (details) => {
    if (details.level === "error") errors.push(details.message);
  });
  try {
    await win.loadFile(path.join(root, "index.html"), {
      query: { tools: "1" },
    });
    await win.webContents.executeJavaScript("window.wildboundBoot.ready");
    await win.webContents.executeJavaScript("window.showcase('inventory')");
    await win.webContents.executeJavaScript(
      "document.querySelector('.field-open').click()",
    );
    for (const tab of ["Craft", "Skills"]) {
      const result = await win.webContents.executeJavaScript(
        `(()=>{const d=document.querySelector('#field-kit-dialog');[...d.querySelectorAll('nav button')].find(b=>b.textContent===${JSON.stringify(tab)}).click();return {open:d.open,buttons:d.querySelectorAll('button').length,width:d.scrollWidth,client:d.clientWidth};})()`,
      );
      if (
        !result.open ||
        result.buttons < 6 ||
        result.width > result.client + 2
      )
        throw Error(
          "Invalid Field Kit layout: " + tab + " " + JSON.stringify(result),
        );
      await new Promise((r) => setTimeout(r, 120));
      fs.writeFileSync(
        path.join(root, "test-output", "field-" + tab.toLowerCase() + ".png"),
        (await win.webContents.capturePage()).toPNG(),
      );
    }
    await win.setSize(1000, 700);
    await new Promise((r) => setTimeout(r, 120));
    fs.writeFileSync(
      path.join(root, "test-output", "field-small.png"),
      (await win.webContents.capturePage()).toPNG(),
    );
    const perf = await win.webContents.executeJavaScript(`(async()=>{
    const {Game,EVENTS}=await import('./src/core.mjs'),{Renderer}=await import('./src/render.mjs'),{Assets}=await import('./src/assets.mjs');
    const assets=new Assets();await assets.load();const c=document.createElement('canvas');c.style.width='1280px';c.style.height='720px';document.body.append(c);const r=new Renderer(c,assets),g=new Game(()=>.34);g.spriteLibrary=assets.library;for(let n=0;n<6;n++)g.addPlayer('pad:'+n);g.start();g.spawnEvent(EVENTS.findIndex(e=>e.type==='stampede'));g.openingBoard=false;g.weather={type:'monsoon',life:100};
    const samples=[];for(let frame=0;frame<90;frame++){const t=performance.now();g.update(1/60,{});r.draw(g,1/60);r.ctx.getImageData(0,0,1,1);if(frame>10)samples.push(performance.now()-t);}samples.sort((a,b)=>a-b);c.remove();return {meanMs:samples.reduce((a,b)=>a+b,0)/samples.length,p95Ms:samples[Math.floor(samples.length*.95)],samples:samples.length};
  })()`);
    fs.writeFileSync(
      path.join(
        root,
        "test-output",
        "field-performance" +
          (process.argv.includes("--software-rendering") ? "-software" : "") +
          ".json",
      ),
      JSON.stringify({ perf, errors }, null, 2),
    );
    console.log(JSON.stringify({ perf, errors }));
    app.exit(errors.length ? 1 : 0);
  } catch (e) {
    console.error(e);
    app.exit(1);
  }
});
