const path=require('node:path'),fs=require('node:fs'),root=path.resolve(__dirname,'..');
// Only this isolated child exits. No user game/profile/build is touched.
if(!process.versions.electron){
 const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
 const child=require('node:child_process').spawnSync(path.join(root,'test-output/electron-41.10.7/electron.exe'),[__filename],{cwd:root,env,encoding:'utf8',timeout:100000});
 if(child.stdout)process.stdout.write(child.stdout);if(child.stderr)process.stderr.write(child.stderr);if(child.error)console.error(child.error);process.exit(child.status??1);
}
const {app,BrowserWindow}=require('electron'),out=path.join(root,'test-output','succubus-qa-'+Date.now()+'-'+process.pid);fs.mkdirSync(out,{recursive:true});
app.disableHardwareAcceleration();app.setPath('userData',path.join(out,'profile'));const deadline=setTimeout(()=>app.exit(1),90000);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1280,height:900,useContentSize:true,webPreferences:{offscreen:true}}),errors=[];
 w.webContents.on('console-message',event=>{if(event.level==='error'&&/Error|Exception/.test(event.message))errors.push(event.message);});
 const run=source=>w.webContents.executeJavaScript('(async()=>{'+source+'})()');
 try{
  await w.loadFile(path.join(process.env.WILDBOUND_VERIFY_APP||root,'index.html'),{query:{tools:'1'}});
  await run('await window.wildboundBoot.ready;const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;await new Promise(raf);return true;');
  const report=await run(`
   const [{Game,EVENTS},{Assets},{Animator},{Renderer},{HeroUI},items,motion,charm,ai,{saveSession,restoreSession},{rigSubject},{defaultPlayerMotion},{capturedLayers,captureLayers,releaseLayers}]=await Promise.all([
    import('./src/core.mjs'),import('./src/assets.mjs'),import('./src/animation.mjs'),import('./src/render.mjs'),import('./src/hero-ui.mjs'),import('./src/items.mjs'),import('./src/succubus-motion.mjs'),import('./src/succubus-charm.mjs'),import('./src/succubus.mjs'),import('./src/session.mjs'),import('./src/rig-subjects.mjs'),import('./src/player-motion.mjs'),import('./src/render-order.mjs')]);
   const {ITEMS,SUCCUBUS_DROPS,SUCCUBUS_EQUIPMENT}=items,checks=[],pictures={},assert=(ok,message)=>{if(!ok)throw Error(message);checks.push(message);};
   const assets=new Assets();await assets.load();const animator=new Animator(assets),g=new Game(()=>.5),p=g.addPlayer('keyboard','Charmed tester'),q=g.addPlayer('pad:9','Teammate');g.start();g.openingBoard=false;g.scenery=[];g.house=null;g.terrain.fill('grass');g.enemies=[];
   Object.assign(p,{x:700,y:770,faceX:1,faceY:0,hp:100});Object.assign(q,{x:755,y:770,faceX:-1,faceY:0,hp:100});g.spawnEvent(EVENTS.findIndex(e=>e.kind==='succubus'));
   const foes=g.enemies.filter(e=>e.kind==='succubus');assert(foes.length===2&&g.eventSpawnCount===2,'Real event spawns exactly two equipped succubi');foes.forEach((e,i)=>Object.assign(e,{x:800+i*70,y:675,faceX:0,faceY:1,cooldown:99,succubusKissCooldown:99}));
   const sheet=document.createElement('canvas');sheet.width=1280;sheet.height=720;const sc=sheet.getContext('2d');sc.fillStyle='#26333a';sc.fillRect(0,0,1280,720);sc.imageSmoothingEnabled=false;
   const hashes=new Set();for(const [row,action]of ['idle','walk','fly','whip','kiss','death'].entries())for(let d=0;d<8;d++){
    const actor={kind:'succubus',x:d*160+80,y:row*120+103,hp:180,faceX:-Math.sin(d*Math.PI/4),faceY:Math.cos(d*Math.PI/4),animationAction:action,playerFrame:action==='whip'?5:3};animator.draw(sc,actor,1.25,112);
    sc.font='11px monospace';sc.textAlign='center';sc.fillStyle='#e6d4bb';sc.fillText(action+' '+['S','SW','W','NW','N','NE','E','SE'][d],actor.x,row*120+15);
    hashes.add(Array.from(sc.getImageData(d*160,row*120,160,120).data).join(','));
   }assert(hashes.size>40,'Native eight-facing idle/walk/fly/whip/kiss/death frames are distinct');pictures['succubus-eight-facing']=sheet.toDataURL();
   const sample=document.createElement('canvas');sample.width=sample.height=220;const c=sample.getContext('2d');c.translate(110,110);captureLayers(motion.succubusMotion);motion.drawSuccubus(c,{hp:180,faceX:0,faceY:1,animationAction:'fly',playerFrame:3},1);releaseLayers(motion.succubusMotion);
   assert(['Wing L','Wing R','Tail'].every(id=>capturedLayers(motion.succubusMotion,0).some(l=>l.id===id&&l.sprite.pixels.some(Boolean))),'Wing and tail parts are native editable rig layers');
   assert(!defaultPlayerMotion().joints.wingRootL&&!defaultPlayerMotion().joints.tailTip,'Unchanged humanoid rig has neither wings nor tail');
   p.inventory=SUCCUBUS_DROPS.map(type=>({type,qty:1}));for(const type of SUCCUBUS_DROPS)assert(items.equip(p,p.inventory.findIndex(i=>i?.type===type)),'Player equips '+type+' in '+ITEMS[type].slot);
   const worn=document.createElement('canvas');worn.width=600;worn.height=180;const wc=worn.getContext('2d');wc.fillStyle='#283239';wc.fillRect(0,0,600,180);wc.imageSmoothingEnabled=false;
   for(let d=0;d<8;d++)animator.draw(wc,{...p,kind:p.sprite,x:38+d*75,y:120,faceX:-Math.sin(d*Math.PI/4),faceY:Math.cos(d*Math.PI/4)},1,72);pictures['equipped-wings']=worn.toDataURL();
   c.clearRect(-110,-110,220,220);const pose=rigSubject('player').draw(c,p,1);assert(!!pose.wingTipL&&!pose.tailTip&&!p.succubusFlightHeight,'Equipped player wings render without tail or flight ability');
   const e=foes[0];assert(charm.applyCharm(g,p,e),'Live player accepts the five-second charm');p.succubusCharm.attackCooldown=0;const hp=q.hp;g.update(.05,{keyboard:{x:-1,inventory:true,attack:true}});
   assert(q.hp<hp&&e.hp===180&&!p.ui,'Controlled player uses real whip damage against teammate with PvP off, not her mistress');
   assert(charm.succubusTargets(g,e).includes(q)&&!charm.succubusTargets(g,e).includes(p),'Succubus protects the pet while an uncharmed player is in aggro range');
   const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));assert(restored.players[0].succubusCharm.remaining===p.succubusCharm.remaining&&restored.enemies[0].equipment.shoulders==='succubus_wings','Charm timer and succubus loadout survive real JSON reload');
   const canvas=document.createElement('canvas');canvas.style='position:fixed;inset:0;width:1280px;height:900px;z-index:99999';document.body.append(canvas);const r=new Renderer(canvas,assets);r.camera={x:775,y:710,zoom:2.1};r.draw(g,0);
   assert(r.actorQueue.filter(a=>a.kind==='succubus').length===2,'Real world renderer queues both humanoid succubi');pictures['charmed-party']=canvas.toDataURL();
   const hearts=document.createElement('canvas');hearts.width=300;hearts.height=180;const hc=hearts.getContext('2d');hc.translate(150-p.x,100-p.y);charm.drawSuccubusEffects(hc,g);assert(hc.getImageData(0,0,300,180).data.some((v,i)=>i%4===3&&v),'Real canvas renders hearts and charm countdown above the pet');
   q.x=1450;q.y=1450;assert(charm.succubusTargets(g,e).includes(p)&&e.succubusPetFallback,'No player in aggro range: succubus targets her charmed pet');
   e.x=p.x+80;e.y=p.y;e.cooldown=0;for(let n=0;n<20;n++){e.cooldown-=.05;ai.tickSuccubus(g,e,g.players,.05,{},{});}assert(p.hp<100,'Succubus whip actually damages the lone charmed pet');
   charm.tickCharmStatuses(g,p.succubusCharm.remaining);assert(!charm.isCharmed(p),'Charm expires and returns control after five simulation seconds');
   q.x=1450;Object.assign(p,{x:600,y:600,hp:100,invuln:0,charmGrace:0});Object.assign(e,{x:800,y:600,flash:0,cooldown:0,succubusAttack:null,succubusKissCooldown:0});
   ai.tickSuccubus(g,e,[p],.05,{},{});assert(e.succubusAttack==='kiss'&&e.succubusWindup>0&&!g.succubusKisses?.length,'Live AI visibly winds up a kiss before emitting a heart');r.camera={x:700,y:600,zoom:2};r.draw(g,0);pictures['kiss-telegraph']=canvas.toDataURL();
   for(let n=0;n<22;n++){e.cooldown-=.05;ai.tickSuccubus(g,e,[p],.05,{},{});}assert(g.succubusKisses?.length===1,'Kiss windup emits a slow heart projectile');
   for(let n=0;n<32&&!charm.isCharmed(p);n++)charm.tickSuccubusKisses(g,.05);assert(charm.isCharmed(p),'Real heart collision charms the player for five seconds');
   e.hp=0;charm.tickCharmStatuses(g,0);assert(!charm.isCharmed(p),'Defeating the owning succubus immediately breaks her charm');
   const hpBefore=foes[1].hp;foes[1].faction='ally';g.update(.05,{});for(const type of SUCCUBUS_DROPS)assert(g.loot.filter(l=>l.type===type).length===1,'Defeated succubus drops '+type+' once');g.update(.05,{});assert(SUCCUBUS_DROPS.every(type=>g.loot.filter(l=>l.type===type).length===1)&&foes[1].hp===hpBefore,'Loot does not duplicate on the next frame; friendly succubus survives');
   canvas.remove();const host=document.createElement('div');host.style='position:fixed;inset:0;z-index:99999;background:#263039';document.body.append(host);const ui=new HeroUI(host);g.openInventory(p);ui.draw(g,r);const panel=ui.panels.get(p.id);
   const wingButton=[...panel.querySelectorAll('button')].find(b=>b.dataset.mode==='gear'&&b.dataset.slot==='shoulders');assert(!!wingButton?.showItemTooltip,'Wings appear in the real inventory shoulder slot');wingButton.showItemTooltip();assert(panel.querySelector('.item-tooltip').textContent.includes('Hold Jump to rise and hover'),'Wing tooltip describes the actual equipped flight ability');
   window.succubusQA={g,p,q,r,ui,host,checks};return {checks,pictures};
  `);
  for(const [name,png]of Object.entries(report.pictures))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(png.split(',')[1],'base64'));
  await new Promise(resolve=>setTimeout(resolve,120));fs.writeFileSync(path.join(out,'wings-inventory.png'),(await w.webContents.capturePage()).toPNG());
  if(errors.length)throw Error(errors.join('\n'));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({passed:report.checks.length,failed:0,checks:report.checks},null,2));console.log(JSON.stringify({passed:report.checks.length,failed:0,out,checks:report.checks},null,2));clearTimeout(deadline);app.exit(0);
 }catch(error){console.error(error.stack);fs.writeFileSync(path.join(out,'failure.txt'),error.stack);clearTimeout(deadline);app.exit(1);}
});
