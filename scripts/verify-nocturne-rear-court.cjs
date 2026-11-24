const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');

const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root;
const out=path.join(root,'test-output','nocturne-rear-court',base===root?'source':'packaged');
fs.mkdirSync(out,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-nocturne-')));
app.commandLine.appendSwitch('mute-audio');
const deadline=setTimeout(()=>{
 console.error('Nocturne rear court verification timed out.');
 app.exit(1);
},140000);

app.whenReady().then(async()=>{
 const window=new BrowserWindow({show:false,width:1280,height:850,webPreferences:{backgroundThrottling:false}});
 window.webContents.setAudioMuted(true);
 const errors=[];
 window.webContents.on('console-message',event=>{
  if(event.level==='error')errors.push(event.message);
 });
 try{
  await window.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});
  await window.webContents.executeJavaScript('wildboundBoot.ready');
  const {pictures,checks}=await window.webContents.executeJavaScript(`(${verifyPlay})()`);
  for(const [name,data] of Object.entries(pictures)){
   fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));
  }
  const report={passed:checks.length,checks,errors,muted:window.webContents.isAudioMuted()};
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
  app.exit(errors.length||!report.muted?1:0);
 }catch(error){
  console.error(error.stack,errors);
  app.exit(1);
 }finally{
  clearTimeout(deadline);
 }
});

async function verifyPlay(){
 window.requestAnimationFrame=()=>0;
 window.Worker=undefined;
 const {Game}=await import('./src/core.mjs');
 const {Renderer}=await import('./src/render.mjs');
 const {drawTrainTest}=await import('./src/train-world-art.mjs');
 const {damageEnemy}=await import('./src/enemy-damage.mjs');
 const {enterWildLands}=await import('./src/wild-lands.mjs');
 const {alleyGate}=await import('./src/diagon-alley.mjs');
 const {NOCTURNE_REAR_AREAS}=await import('./src/diagon-nocturne-rear.mjs');
 const {NOCTURNE_BOSS_ANCHOR}=await import('./src/nocturne-boss.mjs');
 const {clearShot}=await import('./src/navigation.mjs');
 const {count}=await import('./src/items.mjs');
 const {saveSession,restoreSession}=await import('./src/session.mjs');
 const tools=wildboundPolishTest;
 let game=new Game(()=>.19);
 let hero=game.addPlayer('keyboard','Nocturne tester');
 game.start();
 game.openingBoard=false;
 tools.show('play');
 function useGame(){
  tools.game=game;
  game.spriteLibrary=tools.assets.library;
  game.persist=()=>{};
  game.onSound=()=>{};
 }
 useGame();
 const checks=[],pictures={};
 function check(value,label){
  if(!value)throw Error(label);
  checks.push(label);
 }
 const step=(input={})=>game.update(.05,{keyboard:input});
 function interact(){
  step();
  step({interact:true});
  step();
 }
 const canvas=document.createElement('canvas');
 canvas.style.cssText='position:fixed;inset:0;width:1240px;height:810px';
 document.body.append(canvas);
 const renderer=new Renderer(canvas,tools.assets);
 renderer.setDynamicShadows(false);
 function capture(name,camera){
  renderer.trainScene=null;
  if(camera){
   renderer.cameraOverride=camera;
   drawTrainTest(renderer,game,.016);
   renderer.cameraOverride=null;
  }else renderer.draw(game,.016);
  pictures[name]=canvas.toDataURL();
 }
 function walkTo(x,y){
  for(let i=0;i<140;i++){
   const dx=x-hero.x,dy=y-hero.y,distance=Math.hypot(dx,dy);
   if(distance<=5)return true;
   const norm=Math.max(8,distance);
   step({x:dx/norm,y:dy/norm});
  }
  return false;
 }
 check(enterWildLands(game,{persistent:true}).ok,'Started a real Wild Lands expedition');
 game.trainTest.preparing=false;
 const gate=alleyGate(game);
 Object.assign(hero,{x:gate.x,y:gate.y+57});
 hero.equipment.hand1='starter_wand';
 interact();
 for(let i=0;i<16;i++)step();
 interact();
 check(game.trainTest.design.activeRoom==='diagon','Entered Diagon Alley through the brick wall');
 game.trainTest.noticeUntil=0;
 const [,lane,court]=NOCTURNE_REAR_AREAS;
 const laneX=lane.x+lane.w/2,courtY=court.y+court.h/2;
 Object.assign(hero,{x:laneX,y:5150});
 check(!game.blocked(hero.x,hero.y),'The building frontage leaves the rear lane open');
 step();
 check(!game.trainTest.nocturneBoss,'The approach does not activate the encounter early');
 capture('rear-lane-frontage');
 capture('boss-court-idle',{x:NOCTURNE_BOSS_ANCHOR.x,y:NOCTURNE_BOSS_ANCHOR.y+12,zoom:1.25});
 hero.invincible=true;
 check(walkTo(laneX,courtY)&&walkTo(NOCTURNE_BOSS_ANCHOR.x,NOCTURNE_BOSS_ANCHOR.y+51),
  'Walked from the rear lane into the Nocturne Curios courtyard');
 capture('curios-rear-court');
 const state=game.trainTest.nocturneBoss;
 const boss=game.enemies.find(enemy=>enemy.nocturneBossRole==='lord');
 const guards=game.enemies.filter(enemy=>enemy.nocturneBossRole==='minion');
 check(state&&boss?.hp>0&&guards.length===2&&guards.every(enemy=>enemy.hp>0),
  'Walking into the back courtyard activates Voldemort with exactly two live Death Eaters');
 let lordCast=false,guardCast=false;
 for(let frame=0;frame<180&&(!lordCast||!guardCast);frame++){
  step();
  if(!lordCast&&game.spells.some(bolt=>bolt.owner===boss.id&&bolt.hostile&&bolt.color==='#74ec3b')){
   lordCast=true;
   capture('boss-cast');
  }
  guardCast||=game.spells.some(bolt=>bolt.nocturneBossRole==='minion'&&bolt.hostile);
 }
 if(!lordCast||!guardCast)throw Error('Missing encounter casts '+JSON.stringify({
  lordCast,guardCast,hero:{x:hero.x,y:hero.y,hp:hero.hp},time:game.time,
  casters:[boss,...guards].map(actor=>({role:actor.nocturneBossRole,x:actor.x,y:actor.y,cooldown:actor.cooldown,
   castAt:actor.castAt,clear:clearShot(game,actor,hero),state:actor.state})),spells:game.spells,
 }));
 check(true,'Voldemort and the Death Eaters fire native hostile spells, with green bolts for the boss');
 hero.invincible=false;
 const health=hero.hp;
 for(let frame=0;frame<130&&hero.hp===health;frame++)step();
 check(hero.hp<health&&hero.hp>0,'A native hostile court projectile damages the explorer');
 hero.invincible=true;

 for(const threshold of [.9,.6,.3]){
  boss.hp=boss.maxHp*(threshold-.01);
  for(let frame=0;frame<55&&state.speech?.threshold!==threshold;frame++)step();
  check(state.speech?.threshold===threshold&&state.thresholds.filter(value=>value===threshold).length===1,
   'The boss taunt fires once below '+Math.round(threshold*100)+' percent health');
  capture('taunt-'+Math.round(threshold*100));
 }
 for(const enemy of guards)damageEnemy(enemy,enemy.hp+10,'magic',{g:game,p:hero});
 damageEnemy(boss,boss.hp+10,'magic',{g:game,p:hero});
 for(let frame=0;frame<15&&!state.death;frame++)step();
 check(boss.hp===0&&state.death,'Defeating Voldemort starts his staged death effect');
 for(let frame=0;frame<12;frame++)step();
 capture('boss-death');
 for(let frame=0;frame<140&&!game.loot.some(item=>item.type==='dark_lord_wand');frame++)step();
 const wand=game.loot.find(item=>item.type==='dark_lord_wand');
 check(wand&&game.loot.some(item=>item.type==='dark_essence'&&item.qty===10),
  'The defeated boss leaves his wand and ten Dark Essence on the world floor');
 check(game.loot.some(item=>item.type==='death_eater_iron_mask')&&game.loot.some(item=>item.type==='death_eater_ivory_mask'),
  'Both defeated Death Eaters leave their masks');
 capture('boss-drops');
 Object.assign(hero,{x:wand.x,y:wand.y});
 interact();
 check(count(hero,'dark_lord_wand')===1&&!game.loot.some(item=>item.type==='dark_lord_wand'),
  'The normal Interact pickup moves the unique wand into the backpack');
 game=restoreSession(JSON.parse(JSON.stringify(saveSession(game))));
 hero=game.players[0];
 useGame();
 game.trainTest.preparing=false;
 for(let frame=0;frame<20;frame++)step();
 check(count(hero,'dark_lord_wand')===1&&!game.loot.some(item=>item.type==='dark_lord_wand')&&
  !game.enemies.some(enemy=>enemy.nocturneBossRole&&enemy.hp>0),'A restored checkpoint keeps the dropped wand and encounter state resolved');
 return {checks,pictures};
}
