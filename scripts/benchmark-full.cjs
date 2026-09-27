const { app, BrowserWindow } = require("electron");
const fs = require("node:fs"),
  path = require("node:path");
const root = path.resolve(__dirname, "..");
app.setPath(
  "userData",
  path.join(root, "test-output", "benchmark-full-profile"),
);
app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false,
    width: 1280,
    height: 720,
    webPreferences: { offscreen: true },
  });
  try {
    await win.loadFile(path.join(root, "index.html"));
    await win.webContents.executeJavaScript("window.wildboundBoot.ready");
    const result = await win.webContents.executeJavaScript(`(async()=>{
 const {Assets}=await import('./src/assets.mjs');const assets=new Assets();await assets.load();const result={};
 for(const [name,prefix]of [['before','./test-output/pre-090/src/'],['after','./src/']]){
  const {Game,EVENTS}=await import(prefix+'core.mjs'),{Renderer}=await import(prefix+'render.mjs');const canvas=document.createElement('canvas');canvas.style.cssText='position:absolute;width:1280px;height:720px';document.body.append(canvas);const r=new Renderer(canvas,assets),g=new Game(()=>.34);g.spriteLibrary=assets.library;
  for(let i=0;i<6;i++){const p=g.addPlayer('pad:'+i);p.x=720+i*35;p.y=950;}g.start();g.spawnEvent(EVENTS.findIndex(e=>e.type==='stampede'));g.openingBoard=false;g.weather={type:'monsoon',life:100};
  const draws=[],updates=[];for(let frame=0;frame<150;frame++){let t=performance.now();g.update(1/60,{});const u=performance.now()-t;t=performance.now();r.draw(g,1/60);r.ctx.getImageData(0,0,1,1);if(frame>=30){updates.push(u);draws.push(performance.now()-t);}}
  const stats=a=>{a.sort((a,b)=>a-b);return {meanMs:a.reduce((x,y)=>x+y,0)/a.length,p95Ms:a[Math.floor(a.length*.95)]};};result[name]={draw:stats(draws),update:stats(updates),frames:draws.length};canvas.remove();
 }return result;})()`);
    fs.writeFileSync(
      path.join(root, "test-output", "full-performance.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result));
    app.exit(0);
  } catch (e) {
    console.error(e);
    app.exit(1);
  }
});
