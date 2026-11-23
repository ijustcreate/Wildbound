const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,stage=process.env.BIOME_ENCOUNTER_STAGE||'source',out=path.join(root,'test-output/biome-encounters',stage);
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-biome-encounters-')));app.commandLine.appendSwitch('mute-audio');app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1200,height:820,webPreferences:{backgroundThrottling:false}});w.webContents.setAudioMuted(true);const errors=[];
 w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  await w.loadFile(path.join(base,'index.html'));await w.webContents.executeJavaScript('wildboundBoot.ready');
  const result=await w.webContents.executeJavaScript(`(async()=>{
   if(wildboundBoot.error||!wildboundBoot.finished)throw Error('Boot failed: '+wildboundBoot.error);window.requestAnimationFrame=()=>0;
   const {Game,EVENTS}=await import('./src/core.mjs'),{Assets}=await import('./src/assets.mjs'),{Renderer}=await import('./src/render.mjs');
   const {BIOME_MIXED_EVENTS}=await import('./src/biome-encounters.mjs'),{combatPhase}=await import('./src/enemy-combat-catalog.mjs'),{enemyTelegraph}=await import('./src/enemy-telegraphs.mjs'),{rules}=await import('./src/definitions.mjs');rules.visionRadius=1000;
   const assets=new Assets();await assets.load();const canvas=document.createElement('canvas');canvas.style.cssText='width:1180px;height:760px';document.body.replaceChildren(canvas);const renderer=new Renderer(canvas,assets);renderer.setDynamicShadows(false);
   const checks=[],images={},cases=[],ok=(v,name)=>{checks.push({name,passed:!!v});if(!v)throw Error(name);};
   for(const zone of new Set(BIOME_MIXED_EVENTS.map(e=>e.environment)))for(const party of [1,4]){
    const g=new Game(()=>.5);g.environment=zone;for(let i=0;i<party;i++)g.addPlayer(i?'pad:'+i:'keyboard');g.start();g.onSound=()=>{};g.persist=()=>{};g.spriteLibrary=assets.library;g.openingBoard=false;g.time=20;
    const origin={x:g.players[0].x,y:g.players[0].y};for(const [i,p]of g.players.entries())Object.assign(p,{x:origin.x+i*24,y:origin.y,hp:9999,maxHp:9999,invincible:true,progress:party===1?0:20,ui:null});
    for(const event of EVENTS.filter(e=>e.biomeMixed&&e.environment===zone)){
     Object.assign(g,{enemies:[],traps:[],weather:null,event:null,effects:[],arrows:[],fireballs:[],bananas:[],impBombs:[],impFireCircles:[],firePatches:[]});
     const source=JSON.stringify(event),props=JSON.stringify(g.scenery),index=EVENTS.indexOf(event),oldWorld=g.localWorld;g.localWorld={pack:{events:[index]}};
     g.roll={playerId:g.players[0].id,resolved:true,total:2};g.spawnEvent();g.roll=null;g.localWorld=oldWorld;
     const label=zone+' / '+event.name+' / '+party;
     ok(g.event?.name===event.name,label+' normal picker selects the permitted biome card');
     ok(g.enemies.length===(party===1?2:6),label+' uses the expected intro/co-op composition');
     ok(new Set(g.enemies.map(e=>e.kind)).size>=2,label+' contains different native enemy kinds');
     ok(g.enemies.every(e=>g.players.every(p=>Math.hypot(e.x-p.x,e.y-p.y)>=180)),label+' arrives away from every explorer');
     ok(g.enemies.every(e=>Math.hypot(e.x-origin.x,e.y-origin.y)<=650),label+' stays near its encounter party');
     ok(JSON.stringify(event)===source&&JSON.stringify(g.scenery)===props,label+' preserves authored card and ground scenery');
     for(let i=0;i<8;i++){g.time+=.05;g.tickCombatActors(.05);ok(g.enemies.every(e=>!['windup','active'].includes(combatPhase(e))),label+' arrival stays non-attacking '+i);}
     let maximum=0,footprints=0;const seen=new Set();
     for(let i=0;i<120;i++){
      g.time+=.05;g.tickCombatActors(.05);const attacking=g.enemies.filter(e=>e.groupTurn?.mode==='attack'&&['windup','active'].includes(combatPhase(e)));
      maximum=Math.max(maximum,attacking.length);footprints=Math.max(footprints,g.enemies.filter(e=>enemyTelegraph(e)||e.impWindup>0&&e.impAim).length);for(const e of attacking)seen.add(e.id);
      g.arrows=[];g.fireballs=[];g.bananas=[];g.effects=[];g.impBombs=[];g.impFireCircles=[];
     }
     ok(maximum<=party,label+' maintains per-player offensive turns');ok(footprints<=party,label+' keeps ground warnings sparse');
     const center={x:(origin.x+g.enemies.reduce((n,e)=>n+e.x,0)/g.enemies.length)/2,y:(origin.y+g.enemies.reduce((n,e)=>n+e.y,0)/g.enemies.length)/2,zoom:.8};renderer.cameraOverride=center;Object.assign(renderer.camera,center);renderer.draw(g,0);
     images[zone+'-'+(party===1?'solo':'coop')+'-'+index]=canvas.toDataURL();cases.push({zone,name:event.name,party,count:g.enemies.length,maximum,footprints,attackers:seen.size,scale:g.event.encounterScale});
    }
   }
   return {checks,images,cases};
  })()`);
  for(const [name,data]of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));delete result.images;
  const report={...result,stage,appPath:base,errors,failed:errors.length+result.checks.filter(c=>!c.passed).length};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({stage,checks:report.checks.length,cases:report.cases.length,failed:report.failed,errors,out}));w.destroy();app.exit(report.failed?1:0);
 }catch(error){fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({error:String(error),stack:error.stack,errors},null,2));console.error(error);w.destroy();app.exit(1);}
});
