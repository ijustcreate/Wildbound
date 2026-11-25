const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

const root = path.resolve(__dirname, '..');
const source = path.resolve(process.env.WILDBOUND_VERIFY_APP || root);
if (!process.versions.electron) {
  const env = {...process.env};
  delete env.ELECTRON_RUN_AS_NODE;
  const binary = process.platform === 'win32' ? 'electron.exe' : 'electron';
  const result = spawnSync(path.join(root,'node_modules','electron','dist',binary), [__filename,'--mute-audio'], {
    cwd:root, env, encoding:'utf8', timeout:140000, windowsHide:true,
  });
  process.stdout.write(result.stdout || '');
  process.stderr.write(result.stderr || '');
  if(result.error)console.error(result.error);
  process.exit(result.status ?? 1);
}

const {app,BrowserWindow}=require('electron');
const output=path.join(root,'test-output','moonveil',source===root?'source':'packaged');
fs.mkdirSync(output,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-moonveil-')));
app.commandLine.appendSwitch('mute-audio');
const watchdog=setTimeout(()=>{console.error('Moonveil verification timed out');app.exit(1);},130000);

app.whenReady().then(async()=>{
  const win=new BrowserWindow({show:false,width:1130,height:780,webPreferences:{backgroundThrottling:false}});
  win.webContents.setAudioMuted(true);
  const errors=[];
  win.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});
  try{
    await win.loadFile(path.join(source,'index.html'),{query:{tools:'1'}});
    const {images,...result}=await win.webContents.executeJavaScript('('+verify+')()');
    if(!result.failure){
      await win.loadFile(path.join(source,'index.html'),{query:{tools:'1'}});
      const restart=await win.webContents.executeJavaScript('('+verifyRestart+')()');
      if(restart.failure)result.failure=restart.failure;
      else result.checks.push(...restart.checks);
    }
    const report={...result,source,errors,muted:win.webContents.isAudioMuted()};
    for(const [name,data] of Object.entries(images))
      fs.writeFileSync(path.join(output,name+'.png'),Buffer.from(data.split(',')[1],'base64'));
    fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify(report));
    app.exit(report.failure||errors.length||!report.muted?1:0);
  }catch(error){
    console.error(error.stack,errors);
    app.exit(1);
  }finally{
    clearTimeout(watchdog);
  }
});

async function verify(){
  await wildboundBoot.ready;
  const tools=wildboundPolishTest;
  const [core,renderer,world,travel,siteModule,combat,sessions,smoke]=await Promise.all([
    import('./src/core.mjs'),import('./src/render.mjs'),import('./src/wild-lands.mjs'),
    import('./src/wild-lands-world.mjs'),import('./src/wild-runic-sanctuary-site.mjs'),
    import('./src/enemy-damage.mjs'),import('./src/session.mjs'),import('./src/smoke-monster.mjs'),
  ]);
  const checks=[],images={};
  const expect=(condition,name)=>{
    if(!condition)throw Error(name);
    checks.push(name);
  };
  const canvas=document.getElementById('game-canvas');
  const render=new renderer.Renderer(canvas,tools.assets);
  const raf=window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame=()=>0;
  await new Promise(resolve=>raf(resolve));
  window.Worker=undefined;
  let game,player;
  const use=next=>{
    game=next;
    player=game.players[0];
    tools.game=game;
    tools.renderer=render;
    tools.show('play');
    game.spriteLibrary=tools.assets.library;
    game.persist=game.onSound=()=>{};
    if(game.trainTest)game.trainTest.preparing=false;
  };
  const makeGame=(deferWorld=false)=>{
    const next=new core.Game(()=>.5,{deferWorld});
    next.addPlayer('keyboard','Moonveil explorer');
    return next;
  };
  const at=point=>Object.assign(player,{x:point.x,y:point.y,ui:null});
  const tick=(input={})=>game.update(.05,{keyboard:input});
  const advance=frames=>{for(let i=0;i<frames;i++)tick();};
  const until=(ready,label,frames=200)=>{
    for(let i=0;i<frames&&!ready();i++)tick();
    expect(ready(),label);
  };
  const frame=(name,focus,zoom=1.35)=>{
    render.trainScene=null;
    render.cameraOverride={x:focus.x,y:focus.y,zoom};
    render.cameraFollowSpeed=8;
    Object.assign(render.camera,render.cameraOverride);
    render.draw(game,.05,{sealCapture:!!game.trainTest});
    images[name]=canvas.toDataURL();
  };
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const cat=()=>game.enemies.find(e=>e.runeboundCat&&e.hp>0);
  const monster=()=>game.enemies.find(e=>e.smokeMonsterRole==='core'&&e.hp>0);
  const wisps=()=>game.enemies.filter(e=>e.smokeMonsterRole==='wisp'&&e.hp>0);
  const hit=(enemy,damage)=>combat.damageEnemy(enemy,damage,'physical',{g:game,p:player,secondary:true});
  const darkEssence=()=>game.loot.filter(item=>item.type==='dark_essence');

  try{
    const site=siteModule.MOONVEIL_CIRCLE;
    use(makeGame(true));
    expect(world.enterWildLands(game,{persistent:true,homeStart:true}).ok,'The Wilds opens at the Homestead');
    game.trainTest.preparing=false;
    expect(travel.wildLandsTravel(game,site.id).ok,'Moonveil Circle is a registered Wilds destination');
    until(cat,'The runic sanctuary loads a living cat');
    const living=cat();
    expect(living.faction==='neutral'&&living.sprite==='graveyard_cat','The sanctuary uses a neutral native cat rig');
    expect(siteModule.MOONVEIL_STONES.length===5,'The sanctuary has exactly five runestones');
    const resting=living.state==='idle';
    at({x:living.x-20,y:living.y});
    const calmHp=player.hp;
    advance(50);
    expect(resting&&living.state==='walk'&&!living.aggro&&living.hp>0&&player.hp===calmHp,
      'The cat rests and walks peacefully while an explorer stands beside it');
    at({x:site.x-65,y:site.y+32});
    frame('01-moonveil-circle',{x:site.x,y:site.y-27},1.18);
    at({x:living.x-24,y:living.y});
    Object.assign(player,{faceX:1,faceY:0});
    const catHp=living.hp;
    game.resolveMelee(player,0,{damage:1});
    expect(living.hp>0&&living.hp<catHp,'Native melee can wound the cat without killing it');
    const fleeStart={x:living.x,y:living.y};
    advance(28);
    expect(distance(living,fleeStart)>16,'The injured cat flees');
    const beforeCrossing={x:living.x,y:living.y};
    const angle=Math.atan2(living.y-site.y,living.x-site.x);
    const outside={x:site.x+Math.cos(angle)*170,y:site.y+Math.sin(angle)*170};
    game.moveActor(living,outside.x-living.x,outside.y-living.y);
    expect(distance(living,site)<distance(outside,site)&&distance(beforeCrossing,site)<distance(outside,site),
      'The injured cat cannot cross the stone ward');
    at({x:site.x,y:site.y+25});
    game.moveActor(player,-131,0);
    expect(siteModule.moonveilCatOutside(player.x,player.y),'The explorer can cross the invisible ward');
    frame('02-antlered-cat',living,2);
    at({x:site.x+140,y:site.y+90});
    hit(living,10000);
    tick();
    advance(12);
    frame('03-violet-runes',{x:site.x,y:site.y-27},1.18);
    until(monster,'Killing the cat in the Wilds summons a Cinder Wraith');
    const newborn=monster();
    const beforeImmunity=newborn.hp;
    hit(newborn,10000);
    expect(newborn.unattackable&&newborn.hp===beforeImmunity,'The forming core is immune to damage');
    advance(13);
    expect(newborn.smokeMonsterParts.filter(part=>part.role==='wisp'&&!part.hidden).length===1,
      'Exactly one limb emerges during the opening of the protected formation');
    frame('04-formation',{x:site.x,y:site.y-27},1.18);
    until(()=>!newborn.unattackable,'Formation ends and the core becomes vulnerable');
    expect(wisps().length>=4,'The mature creature exposes multiple living orange wisps');
    frame('05-mature-wraith',newborn);
    const beforeScale=newborn.smokeMonsterScale;
    const wisp=wisps()[0];
    hit(wisp,10000);
    advance(12);
    expect(wisp.hp===0&&newborn.smokeMonsterScale<beforeScale,'A shattered wisp makes the surviving monster smaller');
    frame('06-shrunken-wraith',newborn);
    localStorage.setItem('test-moonveil-restart',JSON.stringify(sessions.saveSession(game)));
    at(newborn);
    Object.assign(player,{hp:100,maxHp:100,invuln:0});
    until(()=>player.hp<100,'Contact with the mature smoke damages the explorer',70);
    hit(newborn,10000);
    advance(28);
    expect(!monster()&&!wisps().length&&darkEssence().length===1,'Destroying the core ends the creature and drops Dark Essence once');
    advance(90);
    expect(!cat()&&!monster()&&darkEssence().length===1,'Waiting never respawns the cat or repeats the reward');
    const saved=JSON.parse(JSON.stringify(sessions.saveSession(game)));
    use(sessions.restoreSession(saved));
    at(site);
    advance(50);
    expect(!cat()&&!monster(),'Reopening the expedition in the same game keeps the sanctuary spent');

    use(makeGame());
    game.start();
    const forceRoll=(tossSeed)=>{
      game.diceCount=1;
      game.rollCooldown=0;
      game.roll=null;
      game.locked=false;
      game.turnOrder=[];
      const sequence=[.25,tossSeed];
      game.random=()=>sequence.shift()??.5;
      expect(game.hitTable(player),'A normal Wildbound roll starts');
      game.resolveRoll();
    };
    forceRoll(.7);
    expect(!monster(),'A regular roll outside the chance range does not summon the Wraith');
    forceRoll(.01);
    const boardMonster=monster();
    expect(boardMonster?.smokeMonsterSource==='board'&&game.event.name==='When the Smoke Walks',
      'An eligible dice roll summons the same creature with its board card and without a cat');
    forceRoll(.01);
    expect(game.enemies.filter(e=>e.smokeMonsterRole==='core'&&e.hp>0).length===1,'A second lucky roll cannot stack an active Wraith');
    game.roll=null;
    until(()=>!boardMonster.unattackable,'Normal Wildbound runs the same protected formation');
    frame('07-board-wraith',boardMonster,1);

    // Use native house colliders to check a gap much narrower than the full monster.
    use(makeGame());
    game.start();
    game.openingBoard=false;
    game.scenery=[];
    game.terrain=Array(2500).fill('grass');
    const door={kind:'door',x:494,y:404,w:12,h:40,open:false};
    game.house={walls:[{x:494,y:40,w:12,h:364},{x:494,y:444,w:12,h:650}],doors:[door],floors:[],furniture:[],pools:[],vehicles:[]};
    at({x:627,y:430});
    const blocked=smoke.spawnSmokeMonster(game,{x:380,y:430},{source:'board'});
    advance(100);
    expect(!door.open&&blocked.x<door.x&&wisps().every(node=>node.x<door.x),'The closed door and its flanking walls hold back the core and its wisps');
    door.open=true;
    until(()=>blocked.x>door.x+door.w+15,'The Wraith pursues through the open doorway',180);
    const parts=blocked.smokeMonsterParts.filter(part=>!part.hidden);
    expect(parts.length>1&&parts.every(part=>!game.blocked(part.x,part.y,2,false,false,false,0)),
      'The articulated parts remain outside native solid collision');
    frame('08-doorway',{x:door.x,y:door.y+20},1.5);
  }catch(error){
    return {checks,images,failure:error.stack};
  }
  return {checks,images};
}

async function verifyRestart(){
  try{
    await wildboundBoot.ready;
    const [sessions,siteModule]=await Promise.all([
      import('./src/session.mjs'),import('./src/wild-runic-sanctuary-site.mjs'),
    ]);
    const saved=JSON.parse(localStorage.getItem('test-moonveil-restart'));
    window.Worker=undefined;
    const game=sessions.restoreSession(saved);
    game.trainTest.preparing=false;
    game.spriteLibrary=wildboundPolishTest.assets.library;
    game.persist=game.onSound=()=>{};
    const {x,y}=siteModule.MOONVEIL_CIRCLE;
    Object.assign(game.players[0],{x,y,ui:null});
    for(let i=0;i<20;i++)game.update(.05,{});
    if(!game.enemies.some(e=>e.runeboundCat&&e.hp>0)||game.enemies.some(e=>e.smokeMonsterRole))
      throw Error('The sanctuary did not reset its cat and Wraith on a fresh launch');
    return {checks:['A fresh game launch restores the cat and clears the previous Wilds summoning']};
  }catch(error){
    return {failure:error.stack};
  }
}
