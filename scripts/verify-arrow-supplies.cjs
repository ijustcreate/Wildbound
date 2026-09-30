const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output');
app.disableHardwareAcceleration();app.setPath('userData',path.join(out,'arrow-supplies-profile'));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:900,webPreferences:{offscreen:true}});
 win.webContents.on('console-message',(_e,...args)=>console.log('renderer',...args));
 try{
  await win.loadFile(path.join(root,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
  await win.webContents.executeJavaScript(`(async()=>{
   const {Game}=await import('./src/core.mjs'),{HeroUI}=await import('./src/hero-ui.mjs'),{give}=await import('./src/items.mjs'),{FieldKit}=await import('./src/field-kit.mjs'),{initializeField}=await import('./src/field-systems.mjs');
   const root=document.createElement('div');root.style='position:fixed;inset:0;z-index:99999;background:#21382c';document.body.append(root);
   const g=new Game(()=>.5),p=g.addPlayer('pad:0','Scout');g.start();g.phase='lobby';p.controllerFamily='xbox';p.inventory=[];p.equipment.hand1='bow';
   for(const [type,qty] of [['arrow',20],['magic_essence',20],['raw_ice',3],['ice_arrow_recipe',1]])give(p.inventory,type,qty);
   const kit=Object.create(FieldKit.prototype);kit.body=document.createElement('div');kit.select=()=>{};kit.action=(text,fn,host=kit.body)=>{const b=document.createElement('button');b.textContent=text;b.onclick=fn;host.append(b);return b;};
   kit.crafting(g,p,initializeField(p));if(kit.body.textContent.includes('Ice arrows'))throw Error('Recipe starts unlocked');
   g.openInventory(p);p.ui.index=3;p.ui.tab='crafting';g.inventoryAction(p,'use');kit.body.replaceChildren();kit.crafting(g,p,p.field);
   const card=[...kit.body.querySelectorAll('article')].find(a=>a.textContent.includes('Ice arrows'));if(!card)throw Error('Recipe missing after use');card.querySelector('button').click();
   give(p.inventory,'arrow',12);const ui=new HeroUI(root);p.ui.panel='gear';ui.draw(g,{});g.inventoryAction(p,'panel');ui.draw(g,{});if(!root.querySelector('.quiver-slot.selected'))throw Error('Quiver not controller reachable');
   g.inventoryAction(p,'prev');ui.draw(g,{});if(p.field.quiver!=='ice_arrow')throw Error('Controller failed to load ice arrows');
   const select=root.querySelector('[aria-label="Quiver ammunition"]');select.value='arrow';select.dispatchEvent(new Event('change'));ui.draw(g,{});if(p.field.quiver!=='arrow')throw Error('Mouse ammo selection failed');
   g.inventoryAction(p,'quiver:ice_arrow');ui.draw(g,{});window.arrowReview={g,p,root,ui};
  })()`);
  for(const [width,height] of [[1280,900],[390,844],[844,390]]){
   win.setSize(width,height);await new Promise(r=>setTimeout(r,150));
   await win.webContents.executeJavaScript(`(()=>{const {ui,g,root}=arrowReview;ui.draw(g,{});const q=root.querySelector('.quiver-slot'),panel=root.querySelector('.hero-panel');if(q.getBoundingClientRect().right>panel.getBoundingClientRect().right||q.scrollWidth>q.clientWidth)throw Error('Quiver overflow');})()`);
   fs.writeFileSync(path.join(out,'quiver-'+width+'.png'),(await win.webContents.capturePage()).toPNG());
  }
  const data=await win.webContents.executeJavaScript(`(async()=>{
   const {drawEmbeddedArrow,drawFlyingArrow}=await import('./src/embedded-arrow.mjs');const canvas=document.createElement('canvas');canvas.width=800;canvas.height=360;const c=canvas.getContext('2d');c.fillStyle='#223c3d';c.fillRect(0,0,800,360);c.scale(3,3);
   for(let i=0;i<4;i++){c.save();c.translate(45+i*60,25);c.rotate(i*.4);drawFlyingArrow(c,{ammoType:i%2?'ice_arrow':'arrow',shaftLength:24},1);c.restore();drawEmbeddedArrow(c,{x:45+i*60,y:75,angle:i*.4,shaftLength:24,qty:i+1,embedDepth:5});}return canvas.toDataURL();
  })()`);fs.writeFileSync(path.join(out,'arrow-supplies.png'),Buffer.from(data.split(',')[1],'base64'));
  console.log('Recipe discovery/use/crafting, controller and mouse quiver switching, responsive layout and arrow rendering passed.');app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
