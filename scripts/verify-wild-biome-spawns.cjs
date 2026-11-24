const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
if(!process.versions.electron){
 const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
 const result=spawnSync(path.join(root,'node_modules/electron/dist/electron.exe'),[__filename,'--mute-audio'],{
  cwd:root,env,encoding:'utf8',timeout:150000,
 });
 process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');
 if(result.error)console.error(result.error);
 process.exit(result.status??1);
}

const {app,BrowserWindow}=require('electron');
const source=process.env.WILDBOUND_VERIFY_APP||root;
const out=path.join(root,'test-output/wild-biome-spawns',source===root?'source':'packaged');
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
const deadline=setTimeout(()=>app.exit(1),145000);

async function verify(){
 window.requestAnimationFrame=()=>0;
 window.Worker=undefined;
 const [
  {Game},{Assets},{Renderer},{enterWildLands},{WILD_LANDS_GATES,WILD_LANDS_EXIT,wildLandsInteract},
  {wildBiomeSafe},{saveSession,restoreSession},
 ]=await Promise.all([
  import('./src/core.mjs'),import('./src/assets.mjs'),import('./src/render.mjs'),import('./src/wild-lands.mjs'),
  import('./src/wild-lands-world.mjs'),import('./src/wild-biome-spawns.mjs'),import('./src/session.mjs'),
 ]);
 const checks=[],pictures={},ok=(condition,label)=>{if(!condition)throw Error(label);checks.push(label);};
 const assets=new Assets();await assets.load();
 const g=new Game(()=>.5),p=g.addPlayer('keyboard','Wilds visitor');
 g.start();g.openingBoard=false;g.spriteLibrary=assets.library;g.persist=()=>{};
 ok(enterWildLands(g,{persistent:true}).ok,'Normal Wilds expedition starts');
 const t=g.trainTest;t.preparing=false;
 const canvas=document.createElement('canvas');canvas.style.cssText='width:1200px;height:800px';document.body.append(canvas);
 const r=new Renderer(canvas,assets);r.dynamicShadows=false;
 const tick=(input={})=>g.update(.05,{keyboard:input});
 const advance=(frames=55)=>{for(let i=0;i<frames;i++)tick();};
 const live=()=>g.enemies.filter(e=>e.wildSpawnKey&&e.hp>0);
 const move=(x,y)=>Object.assign(p,{x,y,ui:null,swimming:false});
 function found(kind,x,y){
  const members=live().filter(e=>e.wildSpawnBiome===kind&&Math.hypot(e.x-x,e.y-y)<1000);
  ok(members.length>0,kind+' wakes native monsters outside immediate player range');
  ok(members.every(e=>!g.blocked(e.homeX,e.homeY,9)&&!wildBiomeSafe(t,e.homeX,e.homeY)),
   kind+' spawn anchors are open and outside protected landmarks');
  return members;
 }
 function capture(name,x,y){
  r.trainScene=null;r.cameraOverride={x,y,zoom:1.2};r.draw(g,.016);
  pictures[name]=canvas.toDataURL();
 }
 for(const [name,x,y] of [['jungle',4100,2600],['ice',9050,5380],['swamp',12800,2600]]){
  move(x,y);advance();
  const monsters=found(name,x,y),actor=monsters.find(e=>e.speed>0)||monsters[0];
  capture(name,actor.x,actor.y-22);
 }
 move(6000,4800);advance();
 const wild=found('forest',6000,4800).find(e=>e.speed>0&&e.kind!=='snake');
 const approach=[[100,0],[-100,0],[0,100],[0,-100]].map(([x,y])=>({x:wild.x+x,y:wild.y+y}));
 const clear=approach.find(q=>!g.blocked(q.x,q.y,13)&&!wildBiomeSafe(t,q.x,q.y)&&
  !g.projectileBlocked((q.x+wild.x)/2,(q.y+wild.y)/2,4));
 ok(clear,'The forest provides a walkable approach to the pack');
 move(clear.x,clear.y);
 p.equipment.hand1='starter_wand';
 const health=wild.hp;
 for(let i=0;i<80&&wild.hp>0;i++){
  const x=wild.x-p.x,y=wild.y-p.y,n=Math.hypot(x,y)||1;
  tick({aimX:x/n,aimY:y/n,attack:i%13<9});
 }
 ok(wild.hp<health,'Physical Attack input damages a natural field monster');
 capture('forest-combat',wild.x,wild.y-20);

 for(const room of ['caverns','shadow']){
  const gate=WILD_LANDS_GATES.find(point=>point.id===room);
  move(gate.x,gate.y);ok(wildLandsInteract(g,p),'Use the '+room+' portal');
  const surface=live().filter(e=>e.wildSpawnRoom==='surface');
  ok(!surface.length,room+' isolates the surface layer');
  advance(70);
  const members=found(room,8000,5450),sample=members[0];
  capture(room,sample.x,sample.y-22);
  const checkpoint=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
  ok(checkpoint.trainTest.design.activeRoom===room&&checkpoint.trainTest.wildBiomeRoomActors.surface.enemies.length>0,
   room+' checkpoint preserves its room and suspended surface');
  move(WILD_LANDS_EXIT.x,WILD_LANDS_EXIT.y);ok(wildLandsInteract(g,p),'Return from '+room);
  ok(live().some(e=>e.wildSpawnRoom==='surface')&&live().every(e=>e.wildSpawnRoom==='surface'),
   room+' return restores the surface and stows the portal monsters');
 }
 return {checks,pictures};
}

app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1280,height:850,webPreferences:{backgroundThrottling:false}});
 w.webContents.setAudioMuted(true);
 const errors=[];
 w.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});
 try{
  await w.loadFile(path.join(source,'index.html'));
  await w.webContents.executeJavaScript('wildboundBoot.ready');
  const {checks,pictures}=await w.webContents.executeJavaScript(`(${verify.toString()})()`);
  if(errors.length)throw Error(errors.join('\n'));
  for(const [name,png] of Object.entries(pictures))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(png.split(',')[1],'base64'));
  console.log(JSON.stringify({passed:checks.length,checks,errors,muted:w.webContents.isAudioMuted(),output:out},null,2));
  clearTimeout(deadline);app.exit(0);
 }catch(error){console.error(error);clearTimeout(deadline);app.exit(1);}
});
