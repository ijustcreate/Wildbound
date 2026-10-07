// Real game input, persistence, canvas and UI, never the player's save profile.
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,out=path.join(root,'test-output','mausoleum-crypt');
fs.mkdirSync(out,{recursive:true});app.disableHardwareAcceleration();app.setPath('userData',fs.mkdtempSync(path.join(out,'profile-')));
const timer=setTimeout(()=>app.exit(1),180000);
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1280,height:850,useContentSize:true,webPreferences:{offscreen:true}}),errors=[];
 w.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});
 const run=s=>w.webContents.executeJavaScript('(async()=>{'+s+'})()');
 try{
  await w.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});
  await run('await window.wildboundBoot.ready;const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;await new Promise(raf);');
  const report=await run(`
   const [{Game,EVENTS},{Renderer},{Assets},{HeroUI},well,crypt,session,{ITEMS},{drawItem}]=await Promise.all([import('./src/core.mjs'),import('./src/render.mjs'),import('./src/assets.mjs'),import('./src/hero-ui.mjs'),import('./src/old-well.mjs'),import('./src/mausoleum-crypt.mjs'),import('./src/session.mjs'),import('./src/items.mjs'),import('./src/item-art.mjs')]);
   const checks=[],pictures={},check=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
   const assets=new Assets();await assets.load();const canvas=document.createElement('canvas'),host=document.createElement('div');
   canvas.style='width:1280px;height:850px';host.style='position:fixed;inset:0;background:#17252d;z-index:99999';document.body.append(canvas,host);
   const r=new Renderer(canvas,assets),ui=new HeroUI(host),g=new Game(()=>.37);g.environment='graveyard';
   const p=g.addPlayer('keyboard','Crypt QA');g.start();g.openingBoard=false;g.bloom=3;p.invincible=true;
   const index=EVENTS.findIndex(e=>e.type==='mausoleum');g.spawnEvent(index);const d=g.portals.find(a=>a.mausoleum),s=d.well;
   check(d?.oldWell&&s.theme==='mausoleum'&&s.rooms.length===8,'Actual cemetery event opens persistent eight-room crypt');
   check(s.enemies.some(e=>e.kind==='spider')&&s.enemies.some(e=>e.kind==='bat')&&s.enemies.some(e=>e.kind==='zombie')&&s.enemies.some(e=>e.kind==='skeleton'),'Crypt has its required four encounter species');
   const terrain=g.terrain,scenery=g.scenery,turn=g.turn,anchor={x:d.x,y:d.y+50};Object.assign(p,anchor);
   const input=(i={},dt=.05)=>g.update(dt,{keyboard:i});
   input();input({interact:true});check(p.room===d.id,'Real Interact enters opened mausoleum');
   check(Math.hypot(p.roomX-s.exit.x,p.roomY-s.exit.y)>45,'Arrival stays outside the stair exit zone');
   Object.assign(p,{roomX:s.exit.x,roomY:s.exit.y});
   for(let n=0;n<8;n++){p.previousInput={};input({interact:true});}
   check(p.room===d.id&&!p.wellExitArmed,'Held entrance button cannot eject player, even with reset input history');
   Object.assign(p,{roomX:s.arrival.x,roomY:s.arrival.y});input();
   const snapshot=(name)=>{r.draw(g,0);ui.draw(g,r);const c=ui.panels.get(p.id).querySelector('.room-view');check(!!c,name+' uses actual room canvas');pictures[name]=c.toDataURL();};
   snapshot('entrance');
   const route=(from,to)=>{
    const cell=a=>Math.floor(a.y/16)*s.width+Math.floor(a.x/16),start=cell(from),end=cell(to),queue=[start],previous=new Map([[start,null]]);
    for(let n=0;n<queue.length&&!previous.has(end);n++){
     const a=queue[n],x=a%s.width,y=Math.floor(a/s.width);
     for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,next=ny*s.width+nx;if(nx>=0&&ny>=0&&nx<s.width&&ny<s.height&&s.tiles[next]&&!previous.has(next)){previous.set(next,a);queue.push(next);}}
    }
    if(!previous.has(end))throw Error('Disconnected crypt route');const path=[];for(let n=end;n!=null;n=previous.get(n))path.unshift(n);return path;
   };
   let walked=0;
   const walk=target=>{
    for(const cell of route({x:p.roomX,y:p.roomY},target)){
     const x=cell%s.width*16+8,y=Math.floor(cell/s.width)*16+8;
     for(let n=0;Math.hypot(x-p.roomX,y-p.roomY)>1;n++){
      if(n>50)throw Error('Crypt movement is stuck');const dx=x-p.roomX,dy=y-p.roomY,len=Math.hypot(dx,dy);
      input({x:dx/len,y:dy/len},Math.min(.05,len/78));walked++;
      if(p.room!==d.id||well.wellTunnelBlocked(s,p.roomX,p.roomY))throw Error('Walking lost room or entered wall');
     }
    }
   };
   const startKnown=s.explored.length;walk(s.chest);
   check(s.explored.length>startKnown+350&&walked>500,'Actual movement explores connected tunnels and remembers chambers');
   input();input({use:true});check(p.ui?.storage==='old-well'&&g.storageFor(p)===s.chest.items,'Use opens real lantern chest, not immediate transfer');
   ui.draw(g,r);ui.panels.get(p.id).querySelector('.storage-sheet.active .selected')?.showItemTooltip?.();check(/lantern/i.test(ui.panels.get(p.id).querySelector('.item-tooltip')?.textContent||''),'Chest selection shows lantern information as tooltip');
   input();input({use:true});check(p.inventory.some(a=>a?.type==='lantern')&&!s.chest.items.some(Boolean),'Controller-equivalent accept transfers one lantern');
   input({close:true});p.equipment.hand2='lantern';snapshot('lantern-treasury');
   check(crypt.mausoleumLights(g,d).some(a=>a.radius===150),'Equipped lantern lights underground exploration');
   const victim=s.enemies.find(e=>e.kind==='skeleton');Object.assign(victim,{speed:0,cooldown:999,hp:ITEMS.crypt_flame_sword.damage+2});
   Object.assign(p,{roomX:victim.x-24,roomY:victim.y,faceX:1,faceY:0,wellAttackCooldown:0});p.equipment.hand1='crypt_flame_sword';
   input();input({attack:true,aimX:1,aimY:0});check(victim.hp===2&&victim.burning===2,'Actual flame sword contact ignites a crypt enemy');
   for(let n=0;n<11;n++)input();check(victim.hp===0&&s.drops.filter(a=>a.id===victim.id+'-drop').length===1,'Burn resolves crypt death and loot once');
   walk(s.coffin);Object.assign(p,{roomX:s.coffin.x,roomY:s.coffin.y+26});input();input({interact:true});
   const boss=s.enemies.find(e=>e.kind===crypt.CRYPT_BOSS_KIND);check(boss.state==='rising'&&s.coffin.awakened,'Coffin Interact wakes one unique skeleton boss');
   for(let n=0;n<20;n++)input();snapshot('coffin-rise');
   for(let n=0;n<21;n++)input();check(boss.state!=='rising'&&boss.hp>0,'Coffin emergence finishes into active boss AI');
   Object.assign(p,{roomX:boss.x,roomY:boss.y+30});Object.assign(boss,{state:'hunt',cooldown:0,attackCount:0});input();
   check(boss.state==='windup'&&boss.attackKind==='sweep','Boss warns before sweeping its blade');snapshot('boss-windup');
   for(let n=0;n<16;n++)input();Object.assign(p,{roomX:boss.x+80,roomY:boss.y});Object.assign(boss,{state:'hunt',cooldown:0});input();
   check(boss.attackKind==='volley','Boss has its separate ranged bone attack');
   for(let n=0;n<19;n++)input();check(s.hazards.length>0&&s.hazards.length<=3,'Boss volley remains bounded to three projectiles');snapshot('boss-volley');
   p.inventory=Array.from({length:24},()=>({type:'sword',qty:1}));p.equipment.hand1='sword';
   Object.assign(p,{roomX:boss.x,roomY:boss.y+26,faceX:0,faceY:-1,wellAttackCooldown:0});boss.hp=8;input();input({attack:true,aimX:0,aimY:-1});
   check(boss.hp===0&&s.coffin.defeated,'Real melee defeats Coffin Warden');
   const rewardCount=()=>s.drops.filter(a=>crypt.CRYPT_REWARDS.includes(a.type)).length;
   check(rewardCount()===2&&s.coffin.rewardsDropped,'Boss guarantees coffin lid shield and flame sword once');
   Object.assign(p,{roomX:boss.x,roomY:boss.y+8});input();check(rewardCount()===2,'Full backpack preserves both boss rewards');
   p.inventory[0]=null;input();check(p.inventory[0]?.type==='coffin_lid_shield'&&rewardCount()===1,'Available slot collects exactly one boss item');
   p.inventory[1]=null;input();check(p.inventory[1]?.type==='crypt_flame_sword'&&rewardCount()===0,'Second free slot collects flame sword without duplicate shield');
   const icons=document.createElement('canvas');icons.width=256;icons.height=112;const ic=icons.getContext('2d');ic.imageSmoothingEnabled=false;
   crypt.CRYPT_REWARDS.forEach((type,n)=>drawItem(ic,type,64+n*128,48,80));pictures['boss-gear']=icons.toDataURL();
   check(new Set(crypt.CRYPT_REWARDS.map(type=>{const c=document.createElement('canvas');c.width=c.height=48;drawItem(c.getContext('2d'),type,24,24,32);return c.toDataURL();})).size===2,'Boss shield and sword have distinct native item art');
   const loaded=session.restoreSession(JSON.parse(JSON.stringify(session.saveSession(g)))),q=loaded.players[0],portal=loaded.portals.find(a=>a.id===q.room);
   check(portal.well.coffin.defeated&&portal.well.coffin.rewardsDropped&&!portal.well.chest.items.some(Boolean),'Save/reload keeps defeated coffin and depleted treasure chest');
   check(portal.well.enemies.find(e=>e.kind===crypt.CRYPT_BOSS_KIND).hp===0&&!portal.well.drops.some(a=>crypt.CRYPT_REWARDS.includes(a.type)),'Save/reload never recreates boss or claimed rewards');
   walk(s.exit);input();check(p.room===d.id,'Standing on stairs never exits automatically');input({use:true});
   check(p.room===null&&Math.hypot(p.x-anchor.x,p.y-anchor.y)<1,'Fresh Use climbs stairs back to original surface anchor');
   check(g.terrain===terrain&&g.scenery===scenery&&g.turn===turn,'Crypt return preserves cemetery objects and board progress');
   const started=performance.now();Object.assign(p,{room:d.id,roomX:s.coffin.x,roomY:s.coffin.y+26});
   const testCanvas=document.createElement('canvas');testCanvas.width=320;testCanvas.height=240;
   for(let n=0;n<60;n++)well.drawOldWellRoom(testCanvas.getContext('2d'),g,p,r.animator);
   const milliseconds=performance.now()-started;check(Number.isFinite(milliseconds)&&s.hazards.length===0,'Sixty real room renders complete with cleared boss hazards');
   return {checks,pictures,movementFrames:walked,roomRender60Milliseconds:milliseconds};
  `);
  for(const [name,png]of Object.entries(report.pictures))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(png.split(',')[1],'base64'));delete report.pictures;
  if(errors.length)throw Error(errors.join('\n'));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({...report,base,errors},null,2));console.log(JSON.stringify({...report,errors}));clearTimeout(timer);app.exit(0);
 }catch(e){console.error(e);fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({error:String(e),errors},null,2));try{fs.writeFileSync(path.join(out,'failure.png'),(await w.webContents.capturePage()).toPNG());}catch{}clearTimeout(timer);app.exit(1);}
});
