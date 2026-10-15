const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
if(!process.versions.electron){const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;const r=require('node:child_process').spawnSync(path.join(root,'node_modules/electron/dist/electron.exe'),[__filename],{cwd:root,env,windowsHide:true,stdio:'inherit',timeout:180000});process.exit(r.status??1);}
const {app,BrowserWindow}=require('electron'),out=path.join(root,'test-output','cemetery-art-cats-'+Date.now());fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();app.setPath('userData',path.join(out,'profile'));
const deadline=setTimeout(()=>app.exit(1),170000);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1200,height:900,useContentSize:true,webPreferences:{backgroundThrottling:false}}),errors=[];
 w.webContents.on('console-message',e=>{if(e.level==='error'&&/Error|Exception/.test(e.message))errors.push(e.message);});
 const run=s=>w.webContents.executeJavaScript('(async()=>{'+s+'})()');
 try{
  await w.loadFile(path.join(process.env.WILDBOUND_VERIFY_APP||root,'index.html'));
  await run(`await window.wildboundBoot.ready;const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;await new Promise(raf);document.querySelector('#loading-overlay')?.remove();`);
  const result=await run(`
   const [{Game},{Assets},{Renderer},{PlayableLobby},{drawBoard,boardPoint},{BOARD_ART_ASSETS},ecology,{drawGraveyardCritter}]=await Promise.all([import('./src/core.mjs'),import('./src/assets.mjs'),import('./src/render.mjs'),import('./src/playable-lobby.mjs'),import('./src/board.mjs'),import('./src/board-art.mjs'),import('./src/graveyard-ecology.mjs'),import('./src/graveyard-art.mjs')]);
   const checks=[],pictures={},assert=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
   await Promise.all([...Object.values(BOARD_ART_ASSETS),'../assets/board-pawns.png'].map(async path=>{const im=new Image();im.src=new URL(path,new URL('./src/board-art.mjs',location.href));await im.decode();}));await new Promise(r=>setTimeout(r,80));
   const canvas=document.createElement('canvas');canvas.width=1120;canvas.height=768;const c=canvas.getContext('2d');c.translate(560,384);c.scale(4,4);
   const sources=[],draw=c.drawImage.bind(c);c.drawImage=(im,...args)=>{sources.push(im.src);draw(im,...args);};
   drawBoard(c,{generatedEnvironment:'graveyard',players:[]},0);
   assert(sources.some(src=>src?.endsWith('board-cemetery-v1.png')),'Cemetery uses generated board texture');
   for(let i=0;i<48;i++){const p=boardPoint(i),color=c.getImageData(Math.floor(560+p.x*4),Math.floor(384+p.y*4),1,1).data;assert(color[0]>130&&color[1]>120&&color[2]>85,'Stone landing '+i+' aligned');}
   pictures.board=canvas.toDataURL();
   const assets=new Assets();await assets.load();const g=new Game(()=>.5);g.environment='graveyard';const p=g.addPlayer('keyboard','Cemetery reviewer');g.start();g.openingBoard=false;g.enemies=[];g.bloom=3;g.explored=new Set(Array.from({length:2500},(_,i)=>i));g.spriteLibrary=assets.library;
   const host=document.createElement('div');host.style='position:fixed;inset:0;z-index:5000;background:#20382b';host.innerHTML='<div class="party-heading"><h1></h1></div><p class="party-help"></p><div id="party-status"></div><div id="player-slots"></div>';document.body.append(host);
   const lobby=new PlayableLobby({root:host,game:()=>g,profiles:{},start(){},sound(){}});lobby.state.sync([p]);Object.assign(lobby.state.members.get(p.id),{spawned:true,panel:null});
   await Promise.all([lobby.mapArt,lobby.cemeteryArt,lobby.beachArt].map(im=>im.decode()));document.getElementById('environment').value='forest';lobby.open(p,'environment');
   const button=[...lobby.panels.querySelectorAll('.map-choice')].find(b=>b.textContent.includes('Graveyard'));assert(!!button,'Cemetery map choice exists');
   const icon=button.querySelector('canvas'),reference=document.createElement('canvas');reference.width=40;reference.height=40;reference.getContext('2d').drawImage(lobby.cemeteryArt,0,0,40,40);assert(icon.toDataURL()===reference.toDataURL(),'Actual menu icon uses generated cemetery card');
   button.click();assert(document.getElementById('environment').value==='graveyard','Click selects cemetery');lobby.open(p,'environment');assert([...lobby.panels.querySelectorAll('.map-choice')].find(b=>b.textContent.includes('Graveyard')).getAttribute('aria-pressed')==='true','Selection persists when menu reopens');
   window.cemeteryQA={g,p,assets,host,lobby,pictures,checks};return {checks,pictures};
  `);
  const save=(name,data)=>fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));
  for(const [name,data]of Object.entries(result.pictures))save(name,data);
  w.setContentSize(1201,901);await new Promise(r=>setTimeout(r,400));fs.writeFileSync(path.join(out,'map-menu.png'),(await w.webContents.capturePage()).toPNG());
  w.setContentSize(560,540);await new Promise(r=>setTimeout(r,300));
  await run(`const {lobby}=window.cemeteryQA;const b=[...lobby.panels.querySelectorAll('.map-choice')].find(b=>b.textContent.includes('Graveyard'));b.focus();b.scrollIntoView({block:'nearest'});`);
  w.setContentSize(561,541);await new Promise(r=>setTimeout(r,400));fs.writeFileSync(path.join(out,'map-menu-small.png'),(await w.webContents.capturePage()).toPNG());
  w.setContentSize(1200,900);
  const motion=await run(`
   const {g,p,assets,host,checks}=window.cemeteryQA;host.replaceChildren();p.ui=null;
   const {Renderer}=await import('./src/render.mjs'),{spawnSurfaceEcology,startleGraveyardCats,tickSurfaceEcology,graveyardHabitat}=await import('./src/graveyard-ecology.mjs'),{drawGraveyardCritter}=await import('./src/graveyard-art.mjs');
   const canvas=document.createElement('canvas');canvas.style='width:100%;height:100%';host.append(canvas);const r=new Renderer(canvas,assets);
   r.camera={x:800,y:800,zoom:1.7};r.draw(g,0);const pictures={worldBoard:canvas.toDataURL()};
   const cat=spawnSurfaceEcology(g).find(a=>a.kind==='graveyard_cat');let found=false;
   for(let n=0;n<8;n++){const dx=Math.cos(n*Math.PI/4),dy=Math.sin(n*Math.PI/4);Object.assign(p,{x:cat.x-dx*44,y:cat.y-dy*44-14,faceX:dx,faceY:dy});if(!g.blocked(p.x,p.y)&&startleGraveyardCats(g,p)){found=true;break;}}
   if(!found)throw Error('No natural cat approach');delete cat.flee;cat.idle='sit';const before={x:cat.x,y:cat.y};
   r.camera={x:cat.x,y:cat.y,zoom:2.5};r.draw(g,0);pictures.catBefore=canvas.toDataURL();
   p.equipment.hand1='sword';p.attack=0;g.attack(p);if(!cat.flee)throw Error('Game attack failed to startle actual cat');
   for(let n=0;n<36;n++){tickSurfaceEcology(g,1/60);if(!graveyardHabitat(g,cat.kind,cat.x,cat.y))throw Error('Fleeing cat crossed obstacle');}
   const travelled=Math.hypot(cat.x-before.x,cat.y-before.y);if(travelled<25||cat.idle!=='run'||!cat.moving)throw Error('Cat did not visibly flee');
   g.time+=.6;r.draw(g,0);pictures.catAfter=canvas.toDataURL();checks.push('Real attack sends naturally seeded cat running on valid ground');
   const poses=document.createElement('canvas');poses.width=800;poses.height=200;const c=poses.getContext('2d');c.fillStyle='#20382b';c.fillRect(0,0,800,200);c.imageSmoothingEnabled=false;
   for(let i=0;i<6;i++){c.save();c.translate(70+i*130,155);c.scale(3,3);drawGraveyardCritter(c,{...cat,x:0,y:0,faceX:i<3?1:-1,idle:i%3===0?'sit':'run'},i*.06);c.restore();}pictures.catPoses=poses.toDataURL();
   return {pictures,checks,travelled};
  `);
  for(const [name,data]of Object.entries(motion.pictures))save(name,data);
  if(errors.length)throw Error(errors.join('\n'));const report={passed:motion.checks.length,checks:motion.checks,travelled:motion.travelled,errors,out};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));clearTimeout(deadline);app.exit(0);
 }catch(e){console.error(e);console.error(errors);fs.writeFileSync(path.join(out,'failure.txt'),String(e));clearTimeout(deadline);app.exit(1);}
});
