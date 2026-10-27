const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output','temple-room-windows');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1280,height:850});w.webContents.setAudioMuted(true);await w.loadFile(path.join(base,'index.html'));await w.webContents.executeJavaScript('window.wildboundBoot.ready');
 const result=await w.webContents.executeJavaScript(`(async()=>{
  const {Game}=await import('./src/core.mjs'),{Renderer}=await import('./src/render.mjs'),{HeroUI}=await import('./src/hero-ui.mjs'),{Assets}=await import('./src/assets.mjs');
  const {ensureTemple,TEMPLE_STAIRS}=await import('./src/temple.mjs'),{generateWellTunnels}=await import('./src/old-well.mjs');
  const assets=new Assets();await assets.load();const g=new Game(()=>.4);g.environment='temple';const p=g.addPlayer('keyboard'),q=g.addPlayer('pad:0');g.start();g.openingBoard=false;ensureTemple(g);g.time=2;
  const canvas=document.createElement('canvas');canvas.style.cssText='position:fixed;inset:0;width:1280px;height:800px;z-index:99990';document.body.append(canvas);
  const renderer=new Renderer(canvas,assets);renderer.camera={x:800,y:800,zoom:1};renderer.dynamicShadows=false;
  const uiRoot=document.createElement('div');uiRoot.style.cssText='position:fixed;inset:0;z-index:99991';document.body.append(uiRoot);const ui=new HeroUI(uiRoot);
  const images=[],checks=[];const draw=label=>{ui.draw(g,renderer);renderer.draw(g,.016);images.push({name:label,png:canvas.toDataURL().split(',')[1]});};
  Object.assign(p,TEMPLE_STAIRS);Object.assign(q,TEMPLE_STAIRS);const portal=g.portals.find(d=>d.temple);g.enterRoom(p,portal);g.enterRoom(q,portal);Object.assign(p,{roomX:116,roomY:176});Object.assign(q,{roomX:208,roomY:176});
  draw('temple-two-players');if(renderer.roomWindows.length!==1||renderer.roomWindows[0].players.length!==2||ui.panels.size!==0)throw Error('Duplicate upper room windows');checks.push('shared upper room, no duplicate HeroUI panel');
  const previous=JSON.stringify(renderer.camera);renderer.draw(g,.016);if(JSON.stringify(renderer.camera)!==previous)throw Error('Background world camera moved with interior');
  q.room=null;draw('temple-split-levels');if(renderer.roomWindows.length!==1||renderer.roomWindows[0].players.length!==1)throw Error('Surface player grouped upstairs');checks.push('surface + upper remain visible');
  const lower={id:'qa-lower',oldWell:true,well:generateWellTunnels(72)};lower.well.explored=lower.well.tiles.map((_,i)=>i);g.portals.push(lower);p.room=q.room=lower.id;Object.assign(p,{roomX:104,roomY:104});Object.assign(q,{roomX:480,roomY:330});draw('shared-lower');if(renderer.roomWindows.length!==1||renderer.roomWindows[0].players.length!==2)throw Error('Duplicate lower windows');checks.push('shared lower camera includes separated players');
  p.room=portal.id;Object.assign(p,{roomX:160,roomY:180});draw('separate-upper-lower');if(renderer.roomWindows.length!==2)throw Error('Different areas incorrectly merged');checks.push('separate areas have separate windows');
  q.room=portal.id;Object.assign(q,{roomX:208,roomY:176});g.sky.elapsed=320;p.equipment.hand1='lantern';draw('temple-night');checks.push('night temple and carried lantern');
  g.openInventory(p);draw('temple-inventory');if(ui.panels.size!==1||renderer.roomWindows.length!==1)throw Error('Personal pack duplicated room');p.ui=null;
  p.room=q.room=null;draw('night-lantern-edge');if(renderer.roomWindows.length)throw Error('Windows did not close on exit');
  return {images,checks};
 })()`);
 for(const a of result.images)fs.writeFileSync(path.join(out,a.name+'.png'),Buffer.from(a.png,'base64'));console.log(JSON.stringify({checks:result.checks}));app.exit(0);
}).catch(e=>{console.error(e);app.exit(1);});
