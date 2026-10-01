const {app,BrowserWindow}=require('electron');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
app.disableHardwareAcceleration();
app.setPath('userData',path.join(root,'test-output/inventory-sizing-profile'));
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1280,height:900,webPreferences:{offscreen:true}});
 try{
  await w.loadFile(path.join(root,'index.html'));
  await w.webContents.executeJavaScript('window.wildboundBoot.ready');
  const result=await w.webContents.executeJavaScript(`(async()=>{
   const {Game}=await import('./src/core.mjs');
   const {HeroUI}=await import('./src/hero-ui.mjs');
   const root=document.createElement('div');root.style.cssText='position:fixed;inset:0;z-index:99999';document.body.append(root);
   const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.start();p.inventory=Array(24).fill(null);
   p.inventory[0]={type:'health_potion',qty:4};p.inventory[1]={type:'sword',qty:1};p.inventory[2]={type:'arrow',qty:20};
   const ui=new HeroUI(root),results=[];
   const measure=()=>Object.fromEntries(['.paper-doll','.inventory-window .item-grid','.inventory-window .item-grid button'].map(s=>{
    const b=root.querySelector(s).getBoundingClientRect();return [s,[b.x,b.y,b.width,b.height]];
   }));
   for(const height of [850,600,420]){
    root.style.height=height+'px';let baseline;
    for(const [panel,index,notice]of [['pack',0,''],['pack',1,''],['pack',2,''],['pack',23,''],['gear',0,''],['pack',0,'Cannot equip this item.']]){
     p.ui={panel,index,notice};ui.draw(g,{});const bounds=measure();
     baseline||=bounds;
     if(JSON.stringify(bounds)!==JSON.stringify(baseline))throw Error('Selection changed geometry at '+height+': '+JSON.stringify({baseline,bounds,panel,index}));
    }
    results.push({height,stable:true});
   }
   return results;
  })()`);
  console.log(JSON.stringify(result));app.exit(0);
 }catch(error){console.error(error);app.exit(1);}
});
