const {app,BrowserWindow}=require('electron'),path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..');app.disableHardwareAcceleration();app.setPath('userData',path.join(root,'test-output/mystery-profile'));
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,width:1400,height:950,webPreferences:{offscreen:true}});try{
 await w.loadFile(path.join(root,'index.html'));await w.webContents.executeJavaScript('window.wildboundBoot.ready');
 const result=await w.webContents.executeJavaScript(`(async()=>{
 const {Assets}=await import('./src/assets.mjs');const assets=new Assets();await assets.load();
 const {Game,EVENTS}=await import('./src/core.mjs');const {ITEMS}=await import('./src/items.mjs');
 const {Designer}=await import('./src/designer.mjs');
 const studio=new Designer(assets,structuredClone(EVENTS),ITEMS,()=>{});studio.tab='Events';studio.eventIndex=studio.events.findIndex(e=>e.type==='mystery');studio.open();
 if(!studio.dialog.textContent.includes('Two-stage mystery'))throw Error('Mystery editor missing');
 const fields=[...studio.dialog.querySelectorAll('label')];const goal=fields.find(l=>l.textContent.includes('First objective'))?.querySelector('select');if(!goal)throw Error('Goal editor missing');goal.value='recover';goal.dispatchEvent(new Event('change'));if(studio.events[studio.eventIndex].mystery.goal!=='recover')throw Error('Goal edit failed');
 studio.dialog.close();studio.dialog.remove();
 const {PlayableLobby}=await import('./src/playable-lobby.mjs');
 const g=new Game(()=>.5),a=g.addPlayer('pad:0'),b=g.addPlayer('pad:1');
 const lobby=Object.create(PlayableLobby.prototype);lobby.getGame=()=>g;lobby.state={members:new Map([[a.id,{panel:'choose',focus:0,held:{}}],[b.id,{panel:'choose',focus:0,held:{}}]])};let ac=0,bc=0;
 const pa=document.createElement('section'),pb=document.createElement('section');pa.dataset.ownerDevice='pad:0';pb.dataset.ownerDevice='pad:1';
 for(const [panel,count]of [[pa,()=>ac++],[pb,()=>bc++]]){const button=document.createElement('button');button.onclick=count;panel.append(button);}
 lobby.nodes=new Map([[a.id,pa],[b.id,pb]]);lobby.navigate(a,{accept:true},'pad:1');if(ac||bc)throw Error('Cross-owner navigation allowed');
 const pad=index=>({index,axes:[0,0],buttons:Array.from({length:16},(_,i)=>({pressed:i===0}))});lobby.controller(pad(0),[]);if(ac!==1||bc!==0)throw Error('Pad 0 leaked');lobby.controller(pad(1),[]);if(ac!==1||bc!==1)throw Error('Pad 1 leaked');
 const {Renderer}=await import('./src/render.mjs');g.environment='house';g.start();g.openingBoard=false;g.sky.elapsed=320;g.spawnEvent(EVENTS.findIndex(e=>e.type==='mystery'&&e.mystery.goal==='recover'));
 const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=850;canvas.style.cssText='position:fixed;inset:0;z-index:99999;width:100%;height:100%';document.body.append(canvas);
 const renderer=new Renderer(canvas,assets);renderer.camera={x:800,y:800,zoom:1.1};renderer.draw(g,.016);
 return 'Electron boot, mystery editor edits, two-controller ownership and night-house rendering passed';})()`);
 await new Promise(resolve=>setTimeout(resolve,500));
 fs.writeFileSync(path.join(root,'test-output/mystery-house.png'),(await w.webContents.capturePage()).toPNG());console.log(result);app.exit(0);
 }catch(e){console.error(e);app.exit(1);}});
