const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
if(!process.versions.electron){const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const r=require('node:child_process').spawnSync(path.join(root,'node_modules/electron/dist/electron.exe'),[__filename],{cwd:root,env,windowsHide:true,stdio:'inherit',timeout:180000});process.exit(r.status??1);}
const {app,BrowserWindow}=require('electron'),out=path.join(root,'test-output','cemetery-pumpkins');fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
const deadline=setTimeout(()=>app.exit(1),170000);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1200,height:900,webPreferences:{backgroundThrottling:false}}),errors=[];
 w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 const run=s=>w.webContents.executeJavaScript('(async()=>{'+s+'})()');
 try{
  await w.loadFile(path.join(root,'index.html'));await run(`await window.wildboundBoot.ready;window.requestAnimationFrame=()=>0;document.querySelector('#loading-overlay')?.remove();`);
  const result=await run(`
   const [{Game},{Assets},{Renderer},{HeroUI},art,{drawPlayer,directionVector,playerMotion},{RigStudio},{drawCreationPreview}]=await Promise.all([import('./src/core.mjs'),import('./src/assets.mjs'),import('./src/render.mjs'),import('./src/hero-ui.mjs'),import('./src/pumpkin-art.mjs'),import('./src/player-motion.mjs'),import('./src/player-studio.mjs'),import('./src/creation-preview.mjs')]);
   const assets=new Assets();await assets.load();const original=JSON.stringify(playerMotion),g=new Game(()=>.5);g.environment='graveyard';const p=g.addPlayer('keyboard','Pumpkin explorer');g.start();g.openingBoard=false;g.enemies=[];g.bloom=3;g.explored=new Set(Array.from({length:2500},(_,i)=>i));
   const sheet=document.createElement('canvas');sheet.width=1200;sheet.height=900;const c=sheet.getContext('2d');c.fillStyle='#18332c';c.fillRect(0,0,1200,900);c.imageSmoothingEnabled=false;c.fillStyle='#f3dbad';c.font='18px sans-serif';c.fillText('Cemetery pumpkins · native + enlarged · eight views',18,25);
   for(const [row,action]of ['idle','run','slash','draw','sleep','death'].entries())for(let d=0;d<8;d++){
    const [faceX,faceY]=directionVector(d),actor={equipment:{head:'jack_o_lantern',hand1:'dagger'},faceX,faceY,animationAction:action,playerFrame:2,hp:100};
    c.save();c.translate(d*148+65,row*106+125);c.scale(2,2);drawPlayer(c,actor,.35);c.restore();c.save();c.translate(d*148+115,row*106+125);drawPlayer(c,actor,.35);c.restore();
   }
   let poses=48;for(const [a,action]of ['walk','run'].entries())for(let frame=0;frame<8;frame++)for(let d=0;d<8;d++){
    const [faceX,faceY]=directionVector(d);c.save();c.translate(25+d*145+frame*14,760+a*90);drawPlayer(c,{equipment:{head:'jack_o_lantern'},faceX,faceY,animationAction:action,playerFrame:frame,hp:100},frame/8);c.restore();poses++;
   }
   const atlas=document.createElement('canvas');atlas.width=256;atlas.height=32;const ac=atlas.getContext('2d');for(let d=0;d<8;d++)art.pumpkinHeadgear(ac,'jack_o_lantern',{x:d*32+16,y:20},d,.35);
   const host=document.createElement('div');host.style='position:fixed;inset:0;z-index:5000;background:#19332c';document.body.append(host);
   p.inventory=Array(24).fill(null);p.inventory[0]={type:'pumpkin',qty:2};p.equipment.hand1='dagger';g.openInventory(p);
   const ui=new HeroUI(host);ui.draw(g,{});let b=host.querySelector('[data-action="use"]');if(!b.textContent.includes('Carve'))throw Error('No live Carve button');b.click();ui.draw(g,{});
   if(p.inventory.filter(i=>i?.type==='jack_o_lantern').length!==1||p.inventory[0].qty!==1)throw Error('Live carving failed');
   const idx=p.inventory.findIndex(i=>i?.type==='jack_o_lantern');g.inventoryAction(p,'select:'+idx);g.inventoryAction(p,'equip');ui.draw(g,{});if(p.equipment.head!=='jack_o_lantern')throw Error('Equip failed');
   window.pumpkinQA={g,p,ui,host,assets};
   // Real studio preview and creator render use the same unchanged humanoid rig.
   const studioHost=document.createElement('div');document.body.append(studioHost);const studio=new RigStudio(()=>{});studio.mount(studioHost);studio.previewEquipment.head='jack_o_lantern';studio.animate(.35);studioHost.remove();
   const creator=document.createElement('canvas');creator.width=240;creator.height=160;drawCreationPreview(creator.getContext('2d'),p.appearance,{time:.35});
   if(JSON.stringify(playerMotion)!==original)throw Error('Rendering mutated authored rig');
   return {poses,assembled:sheet.toDataURL(),atlas:atlas.toDataURL(),creator:creator.toDataURL(),rigUnchanged:true};
  `);
  for(const name of ['assembled','atlas','creator']){fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(result[name].split(',')[1],'base64'));delete result[name];}
  const manifest={version:1,subject:'player',pixelDensity:1,parts:[{id:'jack_o_lantern',joint:'head',views:Array.from({length:8},(_,direction)=>({direction,file:'atlas.png',rect:[direction*32,0,32,32],pivot:[16,20],size:[32,32],offset:[0,0]}))}]};fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
  w.setContentSize(1201,901);await new Promise(r=>setTimeout(r,400));fs.writeFileSync(path.join(out,'inventory.png'),(await w.webContents.capturePage()).toPNG());
  await run(`const {g,p,host,assets}=window.pumpkinQA;host.replaceChildren();p.ui=null;g.dropLoot(550,1170,'jack_o_lantern',1,'Decoration',true);const canvas=document.createElement('canvas');canvas.style='width:100%;height:100%';host.append(canvas);const {Renderer}=await import('./src/render.mjs');const r=new Renderer(canvas,assets);r.camera={x:570,y:1150,zoom:3};r.draw(g,.016);`);
  w.setContentSize(1202,902);await new Promise(r=>setTimeout(r,400));fs.writeFileSync(path.join(out,'patch.png'),(await w.webContents.capturePage()).toPNG());
  if(errors.length)throw Error(errors.join('\n'));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({...result,errors},null,2));console.log(JSON.stringify({...result,errors,out}));clearTimeout(deadline);app.exit(0);
 }catch(e){console.error(e);console.error(errors);clearTimeout(deadline);app.exit(1);}
});
