const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,stage=process.env.BIOME_ART_STAGE||'source',out=path.join(root,'test-output/biome-telegraph-style',stage);
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-tell-art-')));app.commandLine.appendSwitch('mute-audio');app.disableHardwareAcceleration();
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,width:1200,height:820,webPreferences:{backgroundThrottling:false}});w.webContents.setAudioMuted(true);const errors=[];w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
try{await w.loadFile(path.join(base,'index.html'));await w.webContents.executeJavaScript('wildboundBoot.ready');
const result=await w.webContents.executeJavaScript(`(async()=>{
 window.requestAnimationFrame=()=>0;
 const {Game}=await import('./src/core.mjs'),{Assets}=await import('./src/assets.mjs'),{Renderer}=await import('./src/render.mjs');
 const {drawEnemyTelegraph,telegraphContour}=await import('./src/enemy-telegraphs.mjs');
 const assets=new Assets();await assets.load();const images={},checks=[];
 const canvas=document.createElement('canvas');canvas.style.cssText='width:1180px;height:760px';document.body.replaceChildren(canvas);const renderer=new Renderer(canvas,assets);renderer.setDynamicShadows(false);
 for(const zone of ['forest','ice','caverns']){
  const g=new Game(()=>.5);g.environment=zone;const p=g.addPlayer('keyboard');g.start();Object.assign(g,{openingBoard:false,enemies:[],traps:[],weather:null,time:20});g.onSound=()=>{};g.persist=()=>{};g.spriteLibrary=assets.library;Object.assign(p,{x:800,y:950,hp:100});
  // Controlled art patch: keep native biome ground and peripheral scenery;
  // remove occluders only inside this disposable comparison scene.
  g.scenery=g.scenery.filter(o=>Math.hypot(o.x-830,o.y-930)>240);
  const rows=[['boar',720,900,{phase:'windup',style:'rush',reach:196,width:50,dx:1,dy:.3,duration:.56,remaining:.24}],['beetle',930,930,{phase:'windup',style:'melee',reach:41,arc:Math.acos(.55),dx:-1,dy:0,duration:.56,remaining:.24}]];
  g.enemies=rows.map(([kind,x,y,speciesCombat],i)=>{const e={id:900+i,kind,x,y,hp:100,maxHp:100,speed:0,damage:10,state:'windup',faceX:speciesCombat.dx,faceY:speciesCombat.dy,group:9};g.configureCreature(e,false);e.speciesCombat=speciesCombat;return e;});
  renderer.cameraOverride={x:830,y:930,zoom:1};Object.assign(renderer.camera,renderer.cameraOverride);renderer.draw(g,0);images[zone+'-native']=canvas.toDataURL();
  const enlarged=document.createElement('canvas');enlarged.width=1400;enlarged.height=700;const c=enlarged.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(canvas,200,200,700,350,0,0,1400,700);images[zone+'-pixels']=enlarged.toDataURL();
 }
 const study=document.createElement('canvas');study.width=960;study.height=320;const c=study.getContext('2d');c.imageSmoothingEnabled=false;
 const old=await import(${JSON.stringify(require('node:url').pathToFileURL(path.join(root,'test-output/biome-telegraphs-before.mjs')).href)}).catch(()=>null);
 for(let i=0;i<2;i++){c.fillStyle='#48624b';c.fillRect(i*480,0,480,320);c.fillStyle='#d5ad72';c.font='14px sans-serif';c.fillText(i?'Revised native pixel contour':'Earlier smooth contour',i*480+18,26);const e={kind:'boar',hp:100,x:i*480+100,y:160,speciesCombat:{phase:'windup',style:'rush',reach:230,width:50,dx:1,dy:.35}};(i||!old?drawEnemyTelegraph:old.drawEnemyTelegraph)(c,e);renderer.animator.draw(c,{...e,faceX:1,faceY:.35,state:'windup'},20.2,48);}
 images['comparison']=study.toDataURL();
 for(const shape of ['circle','lane','cone']){const points=telegraphContour({shape,x:80.3,y:70.8,angle:.37,range:95,width:30,arc:1.1});checks.push({name:shape+' uses integer world-pixel contour',passed:points.every(p=>p.every(Number.isInteger))});}
 return {images,checks};
})()`);
for(const [name,data]of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));delete result.images;const report={...result,errors,failed:errors.length+result.checks.filter(c=>!c.passed).length};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({stage,checks:report.checks.length,failed:report.failed,out}));w.destroy();app.exit(report.failed?1:0);
}catch(e){console.error(e);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({error:String(e),stack:e.stack,errors},null,2));w.destroy();app.exit(1);}});
