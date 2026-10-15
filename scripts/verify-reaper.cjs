const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(process.env.WILDBOUND_QA_ROOT||path.join(__dirname,'..')),out=path.join(__dirname,'../test-output/reaper');fs.mkdirSync(out,{recursive:true});
app.disableHardwareAcceleration();app.commandLine.appendSwitch('mute-audio');app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,width:1400,height:1000}),errors=[];w.webContents.setAudioMuted(true);w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{await w.loadFile(path.join(root,'index.html'));const result=await w.webContents.executeJavaScript(`(async()=>{
 await window.wildboundBoot.ready;window.requestAnimationFrame=()=>0;
 const [{drawReaper,reaperMotion},{directionVector,playerMotion},{Animator},{Assets},art,{paintItem},{Game,EVENTS},ai,{rigSubject}]=await Promise.all([import('./src/reaper-motion.mjs'),import('./src/player-motion.mjs'),import('./src/animation.mjs'),import('./src/assets.mjs'),import('./src/reaper-art.mjs'),import('./src/item-art.mjs'),import('./src/core.mjs'),import('./src/reaper-ai.mjs'),import('./src/rig-subjects.mjs')]);
 const before=JSON.stringify([playerMotion,reaperMotion]),assets=new Assets();await assets.load();const animator=new Animator(assets);
 const sheet=document.createElement('canvas');sheet.width=1400;sheet.height=1050;const c=sheet.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#273438';c.fillRect(0,0,sheet.width,sheet.height);c.font='20px sans-serif';c.fillStyle='#e4d9b7';c.fillText('Grim Reaper · native humanoid / 8 facings · enlarged + gameplay scale',20,30);
 const actions=['idle','walk','run','scythe_sweep','scythe_reap','reaper_raise','reaper_channel','death'];let frames=0;
 for(const [row,action]of actions.entries())for(let d=0;d<8;d++){
  const [faceX,faceY]=directionVector(d),clip=reaperMotion.clips[action],actor={kind:'grim_reaper',x:d*170+70,y:row*106+137,hp:100,faceX,faceY,animationAction:action,playerFrame:action==='death'?clip.length-1:Math.floor(clip.length*.55)};
  animator.draw(c,actor,1,78);animator.draw(c,{...actor,x:actor.x+55},1,38);
  c.font='10px sans-serif';c.fillStyle='#b9c7c7';c.fillText(action+' / '+d,d*170+10,row*106+157);
  for(let f=0;f<clip.length;f++){const scratch=document.createElement('canvas');scratch.width=scratch.height=160;const s=scratch.getContext('2d');s.translate(80,90);drawReaper(s,{...actor,playerFrame:f},f/clip.fps);frames++;}
 }
 for(const [i,id]of ['reaper_hood','reaper_chest','reaper_gloves','reaper_skirt','reaper_scythe','deaths_shroud'].entries()){c.save();c.translate(30+i*150,915);c.scale(3,3);paintItem(c,id);c.restore();}
 const atlas=document.createElement('canvas');atlas.width=512;atlas.height=64;const ac=atlas.getContext('2d');for(let d=0;d<8;d++){ac.save();ac.translate(d*64,0);art.reaperHood(ac,'reaper_hood',{x:32,y:32},d);ac.restore();}
 const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.start();g.openingBoard=false;g.scenery=[];g.water=[];g.event={...EVENTS.find(e=>e.kind==='grim_reaper')};g.spawnEvent(EVENTS.findIndex(e=>e.kind==='grim_reaper'));const e=g.enemies.find(e=>e.kind==='grim_reaper');Object.assign(e,{x:p.x+80,y:p.y,hp:100,flash:0});g.update(.016,new Map());if(!e.reaperDrain)throw Error('Actual Game did not start drain');
 const close=document.createElement('canvas');close.width=800;close.height=400;const cc=close.getContext('2d');cc.imageSmoothingEnabled=false;cc.fillStyle='#233237';cc.fillRect(0,0,800,400);
 const show={...e,x:60,y:110,faceX:1,faceY:0,animationAction:'reaper_channel',poseTime:undefined,playerFrame:8},victim={...p,x:205,y:110};show.reaperDrain={...e.reaperDrain,age:2.5};cc.save();cc.scale(3,3);ai.drawReaperDrain(cc,{enemies:[show],players:[victim]});animator.draw(cc,show,2,48);animator.draw(cc,{...victim,sprite:'player'},2,43);cc.restore();cc.font='20px sans-serif';cc.fillStyle='#d6e6d6';cc.fillText('Grim Reaper — Soul Harvest',25,32);
 const [{RigStudio},{HeroUI},{REAPER_EQUIPMENT,REAPER_SET},{drawCreationPreview}]=await Promise.all([import('./src/player-studio.mjs'),import('./src/hero-ui.mjs'),import('./src/items.mjs'),import('./src/creation-preview.mjs')]);
 const mount=document.createElement('div');mount.style.cssText='position:fixed;inset:0;width:1200px;height:850px';document.body.append(mount);const studio=new RigStudio(()=>{});studio.setSubject('grim_reaper');studio.mount(mount);studio.clip='reaper_channel';studio.frame=8;studio.animate(0);if(!mount.querySelector('.ps-clip'))throw Error('Studio failed to mount');studio.resizeObserver?.disconnect();mount.remove();
 const inventory=document.createElement('div');document.body.append(inventory);const ui=new HeroUI(inventory);p.equipment={...REAPER_EQUIPMENT};p.ui={panel:'gear',index:0};ui.draw(g,{animator});if(!inventory.querySelector('.paper-doll'))throw Error('Missing inventory paper doll');inventory.remove();
 const creation=document.createElement('canvas');creation.width=240;creation.height=160;drawCreationPreview(creation.getContext('2d'),p.appearance);
 const portrait=document.createElement('canvas');portrait.width=680;portrait.height=360;const pc=portrait.getContext('2d');pc.fillStyle='#233237';pc.fillRect(0,0,680,360);pc.imageSmoothingEnabled=false;pc.font='18px sans-serif';pc.fillStyle='#d4dfd5';pc.fillText('Death set · drooping hood, robe and Death’s Shroud',20,28);
 for(const [i,d]of [0,7,4].entries()){const [faceX,faceY]=directionVector(d);animator.draw(pc,{kind:'grim_reaper',hp:100,x:100+i*170,y:280,faceX,faceY,animationAction:'idle',playerFrame:0},0,170);}animator.draw(pc,{...victim,equipment:{},sprite:'player',x:600,y:280,faceX:0,faceY:1},0,150);
 const [{drawBansheeSkills},{drawFrostPrison},{BANSHEE_EQUIPMENT}]=await Promise.all([import('./src/banshee-queen.mjs'),import('./src/frost-prison.mjs'),import('./src/items.mjs')]);
 const ice=document.createElement('canvas');ice.width=800;ice.height=400;const ic=ice.getContext('2d');ic.fillStyle='#233237';ic.fillRect(0,0,800,400);ic.save();ic.scale(3,3);const q={kind:'banshee_queen',id:42,hp:100,x:60,y:105,faceX:1,faceY:0,equipment:BANSHEE_EQUIPMENT,bansheeFrostCharge:true,bansheeDrawLeft:.5,bansheeDrawDuration:1.8,bansheeAim:{x:1,y:0}},frozen={...victim,x:205,y:105,equipment:{},bansheeIce:2.5};drawBansheeSkills(ic,{enemies:[q],time:1});animator.draw(ic,q,1,47);animator.draw(ic,{...frozen,sprite:'player'},1,43);drawFrostPrison(ic,frozen,1);ic.restore();
 for(let n=0;n<301;n++)ai.tickReaper(g,e,[p],1/60);if(p.hp!==0||e.hp!==e.maxHp)throw Error('Drain did not execute and heal');
 const lootGame=new Game(()=>.999),looter=lootGame.addPlayer('keyboard');lootGame.start();lootGame.openingBoard=false;
 lootGame.spawnEvent(EVENTS.findIndex(event=>event.kind==='grim_reaper'));
 const fallen=lootGame.enemies.find(enemy=>enemy.kind==='grim_reaper');if(!fallen)throw Error('Reaper encounter missing');
 lootGame.enemies=[fallen];lootGame.loot=[];Object.assign(fallen,{x:looter.x+32,y:looter.y,hp:0});lootGame.update(.016,new Map());
 const gear=lootGame.loot.filter(item=>item.source==='Grim Reaper gear');
 if(gear.length!==REAPER_SET.length||gear.some(item=>!item.manualPickup)||REAPER_SET.some(id=>gear.filter(item=>item.type===id).length!==1))throw Error('Defeated Reaper did not leave the complete set for manual pickup');
 if(JSON.stringify([playerMotion,reaperMotion])!==before)throw Error('Rendering mutated rigs');if(!rigSubject('grim_reaper'))throw Error('Missing Studio subject');
 return {frames,gameDrain:true,gearDrop:true,studio:true,inventory:true,creator:true,rigUnchanged:true,errors:[],pictures:{assembled:sheet.toDataURL(),hood:atlas.toDataURL(),preview:close.toDataURL(),portrait:portrait.toDataURL(),banshee:ice.toDataURL()}};
 })()`);for(const [name,url]of Object.entries(result.pictures))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(url.split(',')[1],'base64'));delete result.pictures;
 const manifest={version:1,subject:'grim_reaper',pixelDensity:1,parts:[{id:'reaper_hood',joint:'head',views:Array.from({length:8},(_,direction)=>({direction,file:'hood.png',rect:[direction*64,0,64,64],pivot:[32,32],size:[64,64],offset:[0,0]}))}]};fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
 result.errors=errors;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2));if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify(result));app.exit(0);
 }catch(e){console.error(e);app.exit(1);}});


