const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output');
app.disableHardwareAcceleration();app.setPath('userData',path.join(out,'arrow-supplies-profile'));
app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:900,webPreferences:{offscreen:true}});
 win.webContents.on('console-message',(_e,...args)=>console.log('renderer',...args));
 try{
  await win.loadFile(path.join(process.env.WILDBOUND_VERIFY_APP||root,'index.html'));await win.webContents.executeJavaScript('window.wildboundBoot.ready');
  await win.webContents.executeJavaScript(`(async()=>{
   const {Game}=await import('./src/core.mjs'),{HeroUI}=await import('./src/hero-ui.mjs'),{give,count,ITEMS,migrateEquipment}=await import('./src/items.mjs'),{FieldKit}=await import('./src/field-kit.mjs'),{initializeField}=await import('./src/field-systems.mjs');
   const root=document.createElement('div');root.style='position:fixed;inset:0;z-index:99999;background:#21382c';document.body.append(root);
   const g=new Game(()=>.5),p=g.addPlayer('pad:0','Scout');g.start();g.openingBoard=false;p.controllerFamily='xbox';p.equipment.hand1='bow';
   p.inventory=[{type:'arrow',qty:20},{type:'ice_arrow',qty:9},{type:'starter_arrow',qty:8},{type:'ice_arrow_recipe',qty:1}];p.field.quiver='ice_arrow';migrateEquipment(p);
   if(count(p,'arrow')!==57||p.field.quiver||ITEMS.ice_arrow||ITEMS.starter_arrow||ITEMS.ice_arrow_recipe)throw Error('Legacy arrows did not migrate to one ordinary supply');
   if(!g.fireArrow(p,.3)||g.arrows.at(-1).ammoType!=='arrow'||count(p,'arrow')!==56)throw Error('Bow does not automatically consume ordinary arrows');
   give(p.inventory,'raw_ice',3);
   const kit=Object.create(FieldKit.prototype);kit.body=document.createElement('div');kit.select=()=>{};kit.action=(text,fn,host=kit.body)=>{const b=document.createElement('button');b.textContent=text;b.onclick=fn;host.append(b);return b;};
   kit.crafting(g,p,initializeField(p));if(kit.body.textContent.includes('Ice arrows'))throw Error('Removed crafting recipe is visible');
   g.openInventory(p);const ui=new HeroUI(root);ui.draw(g,{});g.inventoryAction(p,'panel');if(p.ui.panel!=='gear')throw Error('Equipment navigation failed');g.inventoryAction(p,'panel');if(p.ui.panel!=='pack')throw Error('Inventory still cycles through removed ammo selection');
   ui.draw(g,{});window.arrowReview={g,p,root,ui};
  })()`);
  for(const [width,height] of [[1280,900],[390,844],[844,390]]){
   win.setSize(width,height);for(let n=0;n<30;n++){await new Promise(r=>setTimeout(r,100));const viewport=await win.webContents.executeJavaScript('[innerWidth,innerHeight]'),size=win.getContentSize();if(Math.abs(viewport[0]-size[0])<3&&Math.abs(viewport[1]-size[1])<3)break;}await new Promise(r=>setTimeout(r,250));
   await win.webContents.executeJavaScript(`(()=>{const {ui,g,root}=arrowReview;ui.draw(g,{});if(root.querySelector('.quiver-slot,[aria-label="Quiver ammunition"]'))throw Error('Arrow type selector is still visible');})()`);
   fs.writeFileSync(path.join(out,'ordinary-arrows-'+width+'.png'),(await win.webContents.capturePage()).toPNG());
  }
  const data=await win.webContents.executeJavaScript(`(async()=>{
   const {drawEmbeddedArrow,drawFlyingArrow}=await import('./src/embedded-arrow.mjs');const canvas=document.createElement('canvas');canvas.width=800;canvas.height=360;const c=canvas.getContext('2d');c.fillStyle='#223c3d';c.fillRect(0,0,800,360);c.scale(3,3);
   for(let i=0;i<4;i++){c.save();c.translate(45+i*60,25);c.rotate(i*.4);drawFlyingArrow(c,{ammoType:i%2?'ice_arrow':'arrow',shaftLength:24},1);c.restore();drawEmbeddedArrow(c,{x:45+i*60,y:75,angle:i*.4,shaftLength:24,qty:i+1,embedDepth:5});}return canvas.toDataURL();
  })()`);fs.writeFileSync(path.join(out,'arrow-supplies.png'),Buffer.from(data.split(',')[1],'base64'));
  console.log('Legacy arrows migrate without loss; ordinary ammunition is automatic; selector/recipe are absent at three sizes; arrow rendering passed.');app.exit(0);
 }catch(e){console.error(e);app.exit(1);}
});
