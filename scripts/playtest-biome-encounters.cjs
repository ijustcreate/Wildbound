const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,stage=process.env.BIOME_PLAYTEST_STAGE||'baseline',out=path.join(root,'test-output/biome-playtest',stage),enforce=process.env.BIOME_PLAYTEST_ENFORCE==='1';
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-biome-playtest-')));app.commandLine.appendSwitch('mute-audio');app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1200,height:820,webPreferences:{backgroundThrottling:false}});w.webContents.setAudioMuted(true);const errors=[];w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  await w.loadFile(path.join(base,'index.html'));await w.webContents.executeJavaScript('wildboundBoot.ready');
  const result=await w.webContents.executeJavaScript(`(async()=>{
   if(wildboundBoot.error||!wildboundBoot.finished)throw Error('Boot failed: '+wildboundBoot.error);window.requestAnimationFrame=()=>0;
   const {Game,EVENTS}=await import('./src/core.mjs'),{Assets}=await import('./src/assets.mjs'),{Renderer}=await import('./src/render.mjs'),{combatPhase}=await import('./src/enemy-combat-catalog.mjs');
   const assets=new Assets();await assets.load();const canvas=document.createElement('canvas');canvas.style.cssText='width:1180px;height:760px';document.body.replaceChildren(canvas);const renderer=new Renderer(canvas,assets);renderer.setDynamicShadows(false);
   const images={},cases=[],pairs=new Map();for(const e of EVENTS.filter(e=>e.biomeMixed)){const key=e.enemies.slice(0,2).map(u=>u.kind+':'+(u.combatRole||'')).sort().join('|');pairs.set(key,[...(pairs.get(key)||[]),e.name]);}
   const duplicatePairs=[...pairs.values()].filter(a=>a.length>1);
   const cards=EVENTS.filter(e=>e.biomeMixed);
   for(const [cardIndex,card]of cards.entries())for(const party of [1,2,...(cardIndex%2===0?[4]:[])]){
    let randomState=19871+cardIndex*197+party*11;const random=()=>((randomState=(Math.imul(randomState,1664525)+1013904223)>>>0)/4294967296);
    const g=new Game(random);g.environment=card.environment;g.seed=42;for(let i=0;i<party;i++)g.addPlayer(i?'pad:'+i:'keyboard');g.start();g.onSound=()=>{};g.persist=()=>{};g.spriteLibrary=assets.library;
    Object.assign(g,{enemies:[],traps:[],event:null,weather:null,openingBoard:false,time:20,objective:null});
    const origin={x:g.players[0].x,y:g.players[0].y};for(const [i,p]of g.players.entries())Object.assign(p,{x:origin.x+(i%2?32:-16),y:origin.y+(i>1?32:0),hp:100,maxHp:100,invincible:false,progress:20,ui:null,equipment:{hand1:'sword',hand2:'shield'}});
    for(const [i,p]of g.players.entries()){for(let step=0;step<80;step++){const a=step*2.4,rad=36+Math.floor(step/8)*12,x=origin.x+Math.cos(a)*rad,y=origin.y+Math.sin(a)*rad;if(!g.blocked(x,y,12)&&g.players.slice(0,i).every(q=>Math.hypot(q.x-x,q.y-y)>28)){p.x=x;p.y=y;break;}}}
    const oldWorld=g.localWorld;g.localWorld={pack:{events:[EVENTS.indexOf(card)]}};g.roll={playerId:g.players[0].id,resolved:true,total:2};g.spawnEvent();g.roll=null;g.localWorld=oldWorld;g.objective=null;
    const label=card.environment+'-'+cardIndex+'-'+party;if(g.event?.name!==card.name){cases.push({name:card.name,party,spawned:false});continue;}
    const ids=new Set(g.enemies.map(e=>e.id)),seen=new Set(),starts=[],hits=[],overlaps=[],playerTravel=new Map(g.players.map(p=>[p.id,0]));
    const hurt=g.hurt.bind(g);g.hurt=(p,amount,source)=>{const before=p.hp;const result=hurt(p,amount,source);if(g.players.includes(p)&&p.hp<before)hits.push({time:+(g.time-20).toFixed(3),target:p.id,damage:before-p.hp,source:source?.kind||(source?.hostile?'projectile':'hazard')});return result;};
    let firstHitImage=false,firstTell=false,closeTell=false,clearedAt=null,maximum=0;
    for(let frame=0;frame<900&&g.phase==='play';frame++){
     const input={},before=g.players.map(p=>({x:p.x,y:p.y}));
     for(const [i,p]of g.players.entries()){
      if(p.hp<=0)continue;const foes=g.enemies.filter(e=>ids.has(e.id)&&e.hp>0).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
      const target=foes[i%Math.min(2,foes.length)]||foes[0];if(!target)continue;
      const dx=target.x-p.x,dy=target.y-p.y,d=Math.hypot(dx,dy)||1,side=i%2?1:-1;
      const danger=foes.some(e=>combatPhase(e)==='windup'&&Math.hypot(e.x-p.x,e.y-p.y)<170);
      let x=0,y=0;
      if(frame>=120){if(d>58){x=dx/d;y=dy/d;}else{x=-dy/d*side*.6;y=dx/d*side*.6;}if(party>1&&frame<220){x+=i%2?.45:-.45;y+=i>1?.3:0;}}
      if(x||y){const angle=Math.atan2(y,x),clear=a=>!g.blocked(p.x+Math.cos(a)*24,p.y+Math.sin(a)*24,12);if(!clear(angle)){const turn=[side*.65,-side*.65,side*1.3,-side*1.3,side*1.8].find(offset=>clear(angle+offset));if(turn!=null){x=Math.cos(angle+turn);y=Math.sin(angle+turn);}}}
      input[p.device]={x,y,aimX:dx/d,aimY:dy/d,attack:frame>=120&&d<80&&frame%15<4,dodge:danger&&frame%57===24,block:frame<120&&danger};
     }
     g.update(1/30,input);
     for(const [i,p]of g.players.entries())playerTravel.set(p.id,playerTravel.get(p.id)+Math.hypot(p.x-before[i].x,p.y-before[i].y));
     const turns=g.enemies.filter(e=>ids.has(e.id)&&e.hp>0&&e.groupTurn?.mode==='attack'&&['windup','active'].includes(combatPhase(e)));
     maximum=Math.max(maximum,turns.length);
     for(const e of turns){const key=e.id+':'+e.groupTurn.startedAt;if(seen.has(key))continue;seen.add(key);const p=g.players.find(p=>p.id===e.groupTurn.targetId);starts.push({time:+(g.time-20).toFixed(3),actor:e.kind,target:p?.id});
      for(const other of turns){if(other===e||other.groupTurn.startedAt>e.groupTurn.startedAt||other.groupTurn.startedAt===e.groupTurn.startedAt&&other.id>e.id)continue;const q=g.players.find(p=>p.id===other.groupTurn.targetId);if(p&&q&&p!==q&&Math.hypot(p.x-q.x,p.y-q.y)<110)overlaps.push({time:+(g.time-20).toFixed(3),actors:[other.kind,e.kind],targets:[q.id,p.id],distance:Math.round(Math.hypot(p.x-q.x,p.y-q.y))});}
     }
     const capture=cardIndex%4===0&&(party===1||party===2);
     const nearTell=frame>=120&&!closeTell&&turns.some(e=>g.players.some(p=>Math.hypot(e.x-p.x,e.y-p.y)<150));
     if(capture&&(!firstTell&&turns.length||!firstHitImage&&hits.length||nearTell||frame===300)){
      const live=g.enemies.filter(e=>ids.has(e.id)&&e.hp>0),center={x:live.length?live.reduce((n,e)=>n+e.x,0)/live.length:origin.x,y:live.length?live.reduce((n,e)=>n+e.y,0)/live.length:origin.y,zoom:1.2};renderer.cameraOverride=center;Object.assign(renderer.camera,center);renderer.draw(g,0);images[label+'-'+frame]=canvas.toDataURL();if(turns.length)firstTell=true;if(hits.length)firstHitImage=true;if(nearTell)closeTell=true;
     }
     if(!g.enemies.some(e=>ids.has(e.id)&&e.hp>0)){clearedAt=+(g.time-20).toFixed(2);break;}
    }
    cases.push({name:card.name,zone:card.environment,party,simulated:+(g.time-20).toFixed(2),spawned:true,maximum,starts:starts.length,targets:[...new Set(starts.map(s=>s.target))],damage:g.players.map(p=>({id:p.id,lost:+hits.filter(h=>h.target===p.id).reduce((n,h)=>n+h.damage,0).toFixed(2),travel:Math.round(playerTravel.get(p.id)),alive:p.hp>0})),hits,clusterOverlaps:overlaps,clearedAt,remaining:g.enemies.filter(e=>ids.has(e.id)&&e.hp>0).map(e=>e.kind)});
   }
   return {cases,duplicatePairs,images};
  })()`);
  for(const [name,data]of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));delete result.images;
  const overlaps=result.cases.reduce((n,c)=>n+(c.clusterOverlaps?.length||0),0),failed=errors.length+(enforce?(overlaps>0?1:0)+(result.duplicatePairs.length?1:0)+result.cases.filter(c=>!c.spawned).length:0);
  const report={...result,stage,appPath:base,errors,overlaps,failed};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({stage,cases:result.cases.length,spawnFailures:result.cases.filter(c=>!c.spawned).length,overlaps,duplicatePairs:result.duplicatePairs,failed,out}));w.destroy();app.exit(failed?1:0);
 }catch(error){fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({error:String(error),stack:error.stack,errors},null,2));console.error(error);w.destroy();app.exit(1);}
});
