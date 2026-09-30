const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output','forest-landscape');
app.setPath('userData',fs.mkdtempSync(path.join(out,'regression-')));
app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,width:1440,height:960});
  try{
    await win.loadFile(path.join(root,'dist',require('../package.json').version,'Wildbound-win32-x64/resources/app.asar/index.html'),{query:{tools:'1'}});
    await win.webContents.executeJavaScript('window.wildboundBoot.ready');
    // A/B only the new map generation/rendering while retaining identical UI code.
    await win.webContents.executeJavaScript(`(async()=>{
      let savedSession=null;
      window.desktop={testMode:true,saveSession:async data=>{savedSession=structuredClone(data);},loadSession:async()=>savedSession,saveProfiles:async()=>{},saveProjectRigs:async()=>{}};
      const {Game}=await import('./src/core.mjs'),{createScenery}=await import('./src/world.mjs');
      const start=Game.prototype.start;
      Game.prototype.start=function(){
        const result=start.call(this);
        if(this.generatedEnvironment==='forest'){
          this.forestLandscape=null;this.forestLandscapeVersion=0;
          this.scenery=createScenery(this.seed).filter(p=>{
            const x=Math.floor(p.x/32),y=Math.floor(p.y/32);
            for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(this.terrain[(y+dy)*50+x+dx]!=='grass')return false;
            return true;
          });
        }
        return result;
      };
    })()`);
    const result=await win.webContents.executeJavaScript('window.runSmokeTests()');
    fs.writeFileSync(path.join(out,'legacy-map-ui-smoke.json'),JSON.stringify(result,null,2));
    console.log(JSON.stringify({failed:result.failed,inventory:result.results.filter(r=>/Mouse item action|Robot, vending/.test(r.name))}));
    app.exit(0);
  }catch(error){console.error(error);app.exit(1);}
});
