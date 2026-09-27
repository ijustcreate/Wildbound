const { app, BrowserWindow } = require("electron");
const fs = require("node:fs"),
  path = require("node:path");
const root = path.resolve(__dirname, "..");
const label = process.argv.includes("--before") ? "before" : "after";
app.disableHardwareAcceleration();
app.setPath("userData", path.join(root, "test-output", "stampede-profile"));
app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false,
    webPreferences: { offscreen: true },
  });
  try {
    await win.loadFile(path.join(root, "index.html"));
    await win.webContents.executeJavaScript("window.wildboundBoot.ready");
    const result = await win.webContents.executeJavaScript(`(async()=>{
      const {Animator}=await import('./src/animation.mjs');
      const {Game,EVENTS}=await import('./src/core.mjs');
      const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;
      const c=canvas.getContext('2d');
      const animator=new Animator({});
      const herd=Array.from({length:20},(_,i)=>({kind:'rhino',state:'stampede',moving:true,faceX:1,faceY:0,x:80+(i%5)*235,y:150+Math.floor(i/5)*160,step:i*0.37}));
      const samples=[]; let firstFrame;
      for(let frame=0;frame<126;frame++){
        const start=performance.now();
        c.clearRect(0,0,1280,720);
        for(const a of herd){a.step+=185*0.13/60;animator.draw(c,a,frame/60,61);}
        c.getImageData(0,0,1,1); // Include completion of canvas drawing, not just command submission.
        const elapsed=performance.now()-start;
        if(frame===0)firstFrame=elapsed;
        if(frame>=6)samples.push(elapsed);
      }
      const g=new Game(()=>0.2);g.scenery=[];g.terrain.fill('grass');g.addPlayer('keyboard');g.start();
      g.spawnEvent(EVENTS.findIndex(e=>e.type==='stampede'));g.openingBoard=false;
      const start=performance.now();
      for(let i=0;i<180;i++)g.update(1/60,{});
      samples.sort((a,b)=>a-b);
      return {herd:20,frames:samples.length,firstFrameMs:firstFrame,meanDrawMs:samples.reduce((a,b)=>a+b,0)/samples.length,p95DrawMs:samples[Math.floor(samples.length*.95)],meanUpdateMs:(performance.now()-start)/180};
    })()`);
    fs.mkdirSync(path.join(root, "test-output"), { recursive: true });
    fs.writeFileSync(
      path.join(root, "test-output", `stampede-${label}.json`),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result));
    app.exit(0);
  } catch (error) {
    console.error(error);
    app.exit(1);
  }
});
