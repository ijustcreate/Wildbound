const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
if(!process.versions.electron){
 const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
 const result=spawnSync(path.join(root,'node_modules/electron/dist/electron.exe'),[__filename,'--mute-audio'],{
  cwd:root,env,encoding:'utf8',timeout:120000,
 });
 process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');
 if(result.error)console.error(result.error);
 process.exit(result.status??1);
}

const {app,BrowserWindow}=require('electron');
const source=process.env.WILDBOUND_VERIFY_APP||root;
const out=path.join(root,'test-output/nocturne-dark-wizards',source===root?'source':'packaged');
fs.mkdirSync(out,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
const deadline=setTimeout(()=>app.exit(1),115000);

async function verify(){
 window.requestAnimationFrame=()=>0;
 window.Worker=undefined;
 const [
  {Game},{Assets},{Renderer},{enterWildLands},{alleyGate,alleyBlocked},{leaveTrainTest,trainPrompt},
  {npcDialogueView,npcDialogueAction},{NOCTURNE_DARK_WIZARDS,isNocturneDarkWizardLoot},
  {directionVector},{drawItem},{DEATH_EATER_MASKS},{equip,ITEMS},
 ]=await Promise.all([
  import('./src/core.mjs'),import('./src/assets.mjs'),import('./src/render.mjs'),
  import('./src/wild-lands.mjs'),import('./src/diagon-alley.mjs'),import('./src/train-test.mjs'),
  import('./src/npc-quests.mjs'),import('./src/nocturne-dark-wizards.mjs'),
  import('./src/player-motion.mjs'),import('./src/item-art.mjs'),import('./src/death-eater-masks.mjs'),import('./src/items.mjs'),
 ]);
 const checks=[],images={};
 const ok=(value,message)=>{if(!value)throw Error(message);checks.push(message);};
 const tick=(input={})=>g.update(.05,{keyboard:input});
 const press=input=>{tick(input);tick();};
 const assets=new Assets();await assets.load();
 const g=new Game(()=>.5),original=g.addPlayer('keyboard','Night visitor');
 g.start();g.openingBoard=false;g.spriteLibrary=assets.library;g.persist=()=>{};
 ok(enterWildLands(g).ok,'Enter the preview through its normal launcher');
 g.trainTest.preparing=false;
 const p=g.players[0],gate=alleyGate(g);
 Object.assign(p,{x:gate.x,y:gate.y+65});
 p.equipment.hand1='starter_wand';
 press({interact:true,loot:true});g.trainTest.time+=1;
 press({interact:true,loot:true});
 ok(g.trainTest.design.activeRoom==='diagon','Open the wand gate and enter the Alley with Interact');

 const canvas=document.createElement('canvas');canvas.style.cssText='width:1200px;height:790px';document.body.append(canvas);
 const renderer=new Renderer(canvas,assets);
 renderer.dynamicShadows=false;
 const render=(name,x,y)=>{renderer.trainScene=null;renderer.cameraOverride={x,y,zoom:1.3};renderer.draw(g,.016);images[name]=canvas.toDataURL();};
 function meet(wizard){
  Object.assign(p,{x:wizard.x+54,y:wizard.y,faceX:-1,faceY:0});
  ok(!alleyBlocked(g,wizard.x,wizard.y,12)&&!alleyBlocked(g,p.x,p.y,12),wizard.name+' is reachable on paved ground');
  ok(trainPrompt(g,p).includes(wizard.name.toUpperCase()),wizard.name+' has a distinct talk prompt');
  press({interact:true,loot:true});
  ok(npcDialogueView(g,p).npc.name===wizard.name,wizard.name+' opens real dialogue');
 }
 const [safe,hostile]=NOCTURNE_DARK_WIZARDS;
 meet(safe);
 render('01-corvin-neutral',safe.x,safe.y-22);
 const {npcDialoguePanel,drawNpcDialoguePortraits}=await import('./src/npc-dialogue-ui.mjs');
 const panel=document.createElement('section');document.body.append(panel);
 npcDialoguePanel(panel,g,p,()=>document.createElement('button'));
 drawNpcDialoguePortraits(panel,g,p,renderer.animator);
 ok(panel.textContent.includes('package')&&panel.textContent.includes(safe.name),'Game panel displays the NPC and dialogue options');
 panel.remove();
 npcDialogueAction(g,p,'choice:1');
 press({interact:true,loot:true});
 ok(!p.ui&&!g.enemies.some(e=>e.darkWizardId),'Asking and taking leave keeps the wizard neutral');
 meet(hostile);
 press({down:true});press({down:true});press({interact:true,loot:true});
 const enemy=g.enemies.find(e=>e.darkWizardId===hostile.id);
 ok(enemy?.hp>0&&enemy.faction==='enemy'&&!p.ui,'Picking the threat through native controls triggers the duel');
 const health=p.hp;
 for(let frame=0;frame<55&&health===p.hp;frame++){
  tick();
  if(!images['02-isolde-casts']&&g.arrows.some(a=>a.hostile&&a.ice&&!a.stuck))render('02-isolde-casts',hostile.x,hostile.y-20);
 }
 ok(health>p.hp&&!!images['02-isolde-casts'],'Native enemy projectile renders and damages the player');
 g.random=()=>.34;
 for(let i=0;i<90&&enemy.hp>0;i++){
  const dx=enemy.x-p.x,dy=enemy.y-p.y,length=Math.hypot(dx,dy)||1;
  const aim={aimX:dx/length,aimY:dy/length};
  tick({...aim,attack:i%13<9});
 }
 ok(enemy.defeated,'Normal Attack controls defeat the dark wizard');
 const drops=g.loot.filter(isNocturneDarkWizardLoot);
 const mask=drops.find(l=>l.type.includes('_mask'));
 ok(drops.length===2&&mask?.type==='death_eater_copper_mask'&&drops[0].qty===3,'Defeat drops Dark Essence and the rolled mask');
 render('03-duel-loot',hostile.x,hostile.y-20);
 for(const drop of drops){
  Object.assign(p,{x:drop.x,y:drop.y});
  press({interact:true,loot:true});
  ok(!g.loot.some(l=>l.id===drop.id),'Native Loot input collects '+drop.type);
 }
 ok(equip(p,p.inventory.findIndex(i=>i?.type===mask.type)),'Recovered faceplate equips in the ordinary head slot');
 const faces=document.createElement('canvas');faces.width=960;faces.height=380;
 const c=faces.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#34383d';c.fillRect(0,0,960,380);
 c.font='17px Georgia';
 for(const [row,id] of Object.keys(DEATH_EATER_MASKS).entries()){
  const y=124+row*112;
  c.fillStyle=row%2?'#525857':'#454b4d';c.fillRect(9,y-75,942,105);
  drawItem(c,id,40,y-27,54);
  c.fillStyle='#f1dfb9';c.fillText(ITEMS[id].name,18,y+18);
  for(let d=0;d<8;d++){
   const [faceX,faceY]=directionVector(d);
   renderer.animator.draw(c,{...p,id:40+row*8+d,x:230+d*96,y,faceX,faceY,
    animationAction:'idle',poseTime:0,equipment:{...p.equipment,head:id,hand1:null}},g.time,62);
  }
 }
 images['04-mask-facings']=faces.toDataURL();
 leaveTrainTest(g);
 ok(original.inventory.some(i=>i?.type===mask.type)&&original.inventory.some(i=>i?.type==='dark_essence'&&i.qty===3),
  'Picked-up rewards settle to the original character on returning');
 return {checks,images};
}

app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1280,height:850,webPreferences:{backgroundThrottling:false}});
 win.webContents.setAudioMuted(true);
 const errors=[];
 win.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});
 try{
  await win.loadFile(path.join(source,'index.html'));
  await win.webContents.executeJavaScript('wildboundBoot.ready');
  const {checks,images}=await win.webContents.executeJavaScript(`(${verify.toString()})()`);
  if(errors.length)throw Error(errors.join('\n'));
  for(const [name,png] of Object.entries(images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(png.split(',')[1],'base64'));
  process.stdout.write(JSON.stringify({checks,output:out},null,2)+'\n');
  clearTimeout(deadline);app.exit(0);
 }catch(error){console.error(error);clearTimeout(deadline);app.exit(1);}
});
