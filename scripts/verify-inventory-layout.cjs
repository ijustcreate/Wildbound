const {app, BrowserWindow} = require('electron');
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..');
app.disableHardwareAcceleration();
app.setPath('userData', path.join(root, 'test-output', 'inventory-layout-profile'));
app.whenReady().then(async () => {
  const win = new BrowserWindow({show:false,width:1920,height:1080,webPreferences:{offscreen:true}});
  try {
    await win.loadFile(path.join(root,'index.html'), {query:{tools:'1'}});
    await win.webContents.executeJavaScript('window.wildboundBoot.ready');
    await win.webContents.executeJavaScript(`(async()=>{
      await window.showcase('inventory');
      const old=document.querySelector('#hero-overlays'); old.id='hidden-original-overlays'; old.style.display='none';
      const overlay=document.createElement('div');overlay.id='hero-overlays';old.parentNode.append(overlay);
      const {HeroUI}=await import('./src/hero-ui.mjs'),{Game}=await import('./src/core.mjs');
      window.layoutReview={overlay,HeroUI,Game};
    })()`);
    const results=[];
    for(const [width,height] of [[1920,1080],[1440,940],[1000,700]]) {
      win.setSize(width,height);
      await new Promise(r=>setTimeout(r,100));
      for(const scale of [1,1.3]) for(const count of [1,2,3,4,6]) {
        const result=await win.webContents.executeJavaScript(`(()=>{
          const {overlay,HeroUI,Game}=window.layoutReview;
          document.documentElement.style.setProperty('--ui-scale','${scale}');
          overlay.replaceChildren(); const g=new Game(()=>.4),ui=new HeroUI(overlay);
          for(let i=0;i<${count};i++)g.addPlayer('pad:'+i,'Explorer '+(i+1));g.start();
          const validate=()=>{
            const bounds=overlay.getBoundingClientRect(),panels=[...overlay.children],rects=panels.map(p=>p.getBoundingClientRect());
            return panels.every(p=>p.scrollWidth<=p.clientWidth+1)&&rects.every((a,i)=>a.left>=bounds.left&&a.right<=bounds.right+1&&a.top>=bounds.top&&a.bottom<=bounds.bottom+1&&rects.every((b,j)=>i===j||a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top));
          };
          let valid=true;
          for(let i=0;i<g.players.length;i++){g.openInventory(g.players[i],i%2?'shared':undefined);ui.draw(g,{});valid&&=validate();}
          const full=valid;
          // Resize without changing any inventory state, exercising cached DOM.
          overlay.style.right='120px';ui.draw(g,{});valid&&=validate();overlay.style.right='0px';ui.draw(g,{});
          return {width:${width},height:${height},scale:${scale},count:${count},valid:valid&&full};
        })()`);
        results.push(result);
        if(!result.valid) throw Error(JSON.stringify(result));
        if(count===2) { await new Promise(r=>setTimeout(r,150)); fs.writeFileSync(path.join(root,'test-output',`inventory-${width}-${scale}.png`),(await win.webContents.capturePage()).toPNG()); }
      }
    }
    fs.writeFileSync(path.join(root,'test-output','inventory-layout-results.json'),JSON.stringify(results,null,2));
    console.log(JSON.stringify({checks:results.length,failed:0}));app.exit(0);
  } catch(e) {console.error(e);app.exit(1);}
});
