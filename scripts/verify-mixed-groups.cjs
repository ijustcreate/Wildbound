const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root,stage=process.env.MIXED_GROUP_STAGE||'source',out=path.join(root,'test-output/mixed-groups',stage);
fs.mkdirSync(out,{recursive:true});app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-mixed-groups-')));app.commandLine.appendSwitch('mute-audio');app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:1200,height:820,webPreferences:{backgroundThrottling:false}});w.webContents.setAudioMuted(true);const errors=[];
 w.webContents.on('console-message',e=>{if(e.level==='error')errors.push(e.message);});
 try{
  await w.loadFile(path.join(base,'index.html'));await w.webContents.executeJavaScript('wildboundBoot.ready');
  const result=await w.webContents.executeJavaScript(`(async()=>{
   if(wildboundBoot.error||!wildboundBoot.finished)throw Error('Boot failed: '+wildboundBoot.error);
   window.requestAnimationFrame=()=>0;
   const {rules}=await import('./src/definitions.mjs');rules.visionRadius=1000;
   const {Game}=await import('./src/core.mjs'),{Assets}=await import('./src/assets.mjs'),{Renderer}=await import('./src/render.mjs');
   const {initializeTacticalEnemy}=await import('./src/combat-tactics-state.mjs'),{combatPhase}=await import('./src/enemy-combat-catalog.mjs'),{enemyTelegraph}=await import('./src/enemy-telegraphs.mjs');
   const assets=new Assets();await assets.load();const canvas=document.createElement('canvas');canvas.style.cssText='width:1180px;height:760px';document.body.replaceChildren(canvas);const renderer=new Renderer(canvas,assets);renderer.setDynamicShadows(false);
   const checks=[],images={},scenes=[],ok=(v,name)=>{checks.push({name,passed:!!v});if(!v)throw Error(name);};
   const configs=[
    {name:'patrol',units:[['skeleton',645,600,'shield'],['lion',760,700,'charger'],['archer',800,470,'archer']]},
    {name:'support',units:[['skeleton',645,600,'shield'],['skeleton',566,585],['necromancer',760,680],['skeleton_caster',760,490]]},
    {name:'creatures',units:[['boar',730,660],['arcane_eye',790,480],['ogre',650,540],['imp',750,750]]},
    {name:'coop',coop:true,units:[['skeleton',640,600],['archer',780,490],['boar',1080,650],['fire_elemental',1110,800]]}
   ];
   for(const config of configs){
    const g=new Game(()=>.5),p=g.addPlayer('keyboard');g.start();Object.assign(g,{time:20,house:null,openingBoard:false,scenery:[],enemies:[],traps:[],event:null,weather:null});g.terrain.fill('grass');g.onSound=()=>{};g.persist=()=>{};g.spriteLibrary=assets.library;
    Object.assign(p,{x:600,y:600,hp:9999,maxHp:9999,invincible:true,equipment:{hand1:'sword'}});
    if(config.coop){const q=g.addPlayer('gamepad0');Object.assign(q,{x:1000,y:650,hp:9999,maxHp:9999,invincible:true});}
    for(const [kind,x,y,role]of config.units){const d=Math.hypot(600-x,600-y)||1,e={id:g.nextId++,kind,x,y,hp:300,maxHp:500,speed:60,damage:8,group:5,state:'hunt',cooldown:0,faceX:(600-x)/d,faceY:(600-y)/d};g.configureCreature(e,false);if(role){e.combatRole=role;initializeTacticalEnemy(e);}e.cooldown=0;g.enemies.push(e);}
    if(config.name==='support'){g.enemies[0].hp=80;for(const e of g.enemies){e.healCooldown=0;e.summonCooldown=99;}}
    let maximum=0,footprints=0,quiet=0,support=0;const owners=new Set(),timeline=[];let previous='';
    for(let i=0;i<540;i++){
     g.time+=.05;g.tickCombatActors(.05);
     const offensive=g.enemies.filter(e=>e.groupTurn?.mode==='attack'&&['windup','active'].includes(combatPhase(e))||e.groupTurn?.mode==='attack'&&e.constructAI?.phase==='specialWindup');
     maximum=Math.max(maximum,offensive.length);footprints=Math.max(footprints,g.enemies.filter(e=>enemyTelegraph(e)||e.impWindup>0&&e.impAim).length);
     if(!offensive.length)quiet++;for(const e of offensive)owners.add(e.id);
     support=Math.max(support,g.enemies.filter(e=>e.groupTurn?.mode==='support').length);
     const signature=offensive.map(e=>e.kind+':'+combatPhase(e)).join(',');
     if(signature!==previous){timeline.push({time:Number((g.time-20).toFixed(2)),attack:signature||'opening'});previous=signature;}
     if(i===35||i===85||i===160||i===260){renderer.cameraOverride={x:config.coop?800:665,y:620,zoom:1.15};Object.assign(renderer.camera,renderer.cameraOverride);renderer.draw(g,0);images[config.name+'-'+i]=canvas.toDataURL();}
     // The simulation measures AI scheduling. Discard old projectiles rather than
     // displaying frozen arrows; projectile travel spacing is tested separately.
     g.arrows=[];g.fireballs=[];g.bananas=[];g.effects=[];g.impBombs=[];g.impFireCircles=[];
    }
    ok(maximum<=(config.coop?2:1),config.name+' offensive tells stay within the player count');
    ok(footprints<=(config.coop?2:1),config.name+' keeps the floor to one danger footprint per player');
    ok(quiet>10,config.name+' retains visible opening frames');ok(support<=1,config.name+' never piles up support channels');
    ok(owners.size>=2,config.name+' rotates pressure between different attackers');
    scenes.push({name:config.name,maximum,footprints,quiet,support,owners:[...owners],timeline});
   }
   return {checks,images,scenes};
  })()`);
  for(const [name,data]of Object.entries(result.images))fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(data.split(',')[1],'base64'));delete result.images;
  const report={...result,stage,appPath:base,errors,failed:errors.length+result.checks.filter(c=>!c.passed).length};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({stage,checks:report.checks.length,failed:report.failed,errors,out}));w.destroy();app.exit(report.failed?1:0);
 }catch(error){fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({error:String(error),stack:error.stack,errors},null,2));console.error(error);w.destroy();app.exit(1);}
});
