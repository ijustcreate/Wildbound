const {app,BrowserWindow}=require('electron');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const base=process.env.WILDBOUND_VERIFY_APP||root;
const output=process.env.WILDBOUND_VERIFY_OUT||path.join(root,'test-output','lobby-toys');
fs.mkdirSync(output,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(output,'profile-')));
app.commandLine.appendSwitch('mute-audio');

app.whenReady().then(async()=>{
  const window=new BrowserWindow({show:false,width:1280,height:800,useContentSize:true,webPreferences:{backgroundThrottling:false}});
  window.webContents.setAudioMuted(true);
  const errors=[];
  window.webContents.on('console-message',event=>{
    if(event.level==='error')errors.push(event.message);
  });
  window.webContents.on('render-process-gone',(_event,details)=>errors.push(JSON.stringify(details)));
  const js=source=>window.webContents.executeJavaScript(source);
  try{
    await window.loadURL('about:blank');
    window.webContents.debugger.attach('1.3');
    await window.webContents.debugger.sendCommand('Debugger.enable');
    await window.webContents.debugger.sendCommand('Debugger.setBreakpointByUrl',{
      urlRegex:'src/debug-tools\\.mjs$',lineNumber:3,condition:'(window.lobbyToysContext=ctx,false)'
    });
    await window.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});
    await js('window.wildboundBoot.ready');
    const result=await js('('+verifyActivities.toString()+')()');
    if(errors.length)throw Error(errors.join('\n'));
    const screenshot=await js('window.lobbyToysContext.playableLobby.canvas.toDataURL()');
    fs.writeFileSync(path.join(output,'lobby.png'),Buffer.from(screenshot.split(',')[1],'base64'));
    fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(result,null,2));
    console.log(JSON.stringify(result));
    app.exit(0);
  }catch(error){
    console.error(error);
    for(const message of errors)console.error(message);
    app.exit(1);
  }
});

async function verifyActivities(){
  const ctx=window.lobbyToysContext;
  if(!ctx)throw Error('Lobby verifier could not access the game');
  const frame=requestAnimationFrame.bind(window);
  window.requestAnimationFrame=()=>0;
  await new Promise(frame);
  ctx.newLobby();
  const lobby=ctx.playableLobby;
  const game=ctx.game;
  const pad={index:0,id:'Xbox Wireless Controller',mapping:'standard',connected:true,
    axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
  Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[pad]});
  ctx.previousPads.clear();
  ctx.keys.clear();

  const keyboard=game.addPlayer('keyboard');
  ctx.profiles.assign(keyboard,ctx.profiles.create('Keyboard Explorer'));
  const controllerProfile=ctx.profiles.create('Controller Explorer');
  lobby.keepSelectedPlayers(game.players);
  const member=player=>lobby.state.members.get(player.id);
  const actor=player=>lobby.practice.players.find(candidate=>candidate.id===player.id);
  const tick=(frames=1)=>{
    for(let frame=0;frame<frames;frame++)lobby.update(.02,ctx.inputFrame());
  };
  const pressKey=(code,pressed)=>window.dispatchEvent(new KeyboardEvent(pressed?'keydown':'keyup',{
    code:'Key'+code,key:code.toLowerCase(),bubbles:true,cancelable:true
  }));
  const pressButton=(button,pressed)=>{
    pad.buttons[button]={pressed,value:Number(pressed)};
  };
  const place=(player,x,y,faceX=0,faceY=-1)=>{
    Object.assign(member(player),{x,y,faceX,faceY});
    Object.assign(actor(player),{x,y,faceX,faceY,jumpHeight:0,groundHeight:0,jumpVelocity:0,
      jumpGroundVX:0,jumpGroundVY:0,landTime:0,dashTime:0,slideX:0,slideY:0});
  };
  const checks=[];
  const assert=(condition,message)=>{
    if(!condition)throw Error(message);
    checks.push(message);
  };
  const waitUntil=(condition,limit=80)=>{
    for(let frame=0;frame<limit&&!condition();frame++)tick();
    return condition();
  };
  tick();
  pressButton(0,true);
  tick();
  pressButton(0,false);
  tick();
  const controller=game.players.find(player=>player.device==='pad:0');
  assert(game.players.length===2&&member(keyboard).spawned&&member(controller).panel==='choose',
    'A keyboard explorer is active while the simulated Xbox player chooses an explorer');
  const profileSnapshot=()=>JSON.stringify(ctx.profiles.data);

  place(keyboard,120,310);
  tick();
  const beforeRing=lobby.state.bellRangAt;
  pressKey('E',true);
  tick();
  const ring=lobby.state.bellRangAt;
  tick(35);
  assert(ring>beforeRing&&lobby.state.bellRangAt===ring&&member(controller).panel==='choose',
    'Holding keyboard interact rings once while the other explorer is choosing');
  pressKey('E',false);
  tick();
  ctx.profiles.assign(controller,controllerProfile);
  lobby.close(controller);
  lobby.keepSelectedPlayers(game.players);
  const savedProfiles=profileSnapshot();
  const savedProgress=JSON.stringify(game.players.map(p=>[p.inventory,p.progress,p.xp]));
  place(keyboard,120,310);
  // The second actor is created by the first practice frame after selection.
  Object.assign(member(controller),{x:136,y:310,faceX:0,faceY:-1});
  tick();
  pressButton(3,true);
  tick();
  pressButton(3,false);
  tick();
  assert(lobby.state.bellRangAt>ring,'The second explorer can ring the same bell with Xbox Y');
  assert(!member(keyboard).panel&&!member(controller).panel&&!lobby.boardReadyMenuOpen,
    'The desk bell leaves both explorers free to move');

  const {LOBBY_BALL_SPAWN}=await import(new URL('./src/lobby-fireplace-ball.mjs',location.href));
  const ball=lobby.state.fireplaceBall;
  const behindBall=player=>place(player,ball.x,ball.y+29);
  place(controller,330,330);
  behindBall(keyboard);
  pressKey('E',true);
  tick();
  assert(ball.vy<0&&ball.lastKicker===keyboard.id,'Keyboard interact kicks the shared ball toward the grate');
  assert(waitUntil(()=>ball.goals===1)&&ball.scorer===keyboard.id,
    'The first fireplace goal credits the keyboard explorer');
  assert(waitUntil(()=>ball.goalTime===0)&&ball.x===LOBBY_BALL_SPAWN.x&&ball.y===LOBBY_BALL_SPAWN.y,
    'The ball automatically returns to the floor after the goal');
  tick(30);
  assert(ball.goals===1&&ball.vx===0&&ball.vy===0,'Holding interact through the reset does not kick again');
  pressKey('E',false);
  tick();
  place(keyboard,125,385);
  behindBall(controller);
  pressButton(3,true);
  tick();
  pressButton(3,false);
  assert(waitUntil(()=>ball.goals===2)&&ball.scorer===controller.id,
    'Xbox Y kicks and credits the second explorer on the same ball');

  const {LOBBY_HOP_FURNITURE}=await import(new URL('./src/lobby-furniture-streak.mjs',location.href));
  const [stool,ottoman,bench]=LOBBY_HOP_FURNITURE;
  const center=(prop,axis)=>axis==='x'?prop.x+prop.w/2:prop.y+prop.h/2;
  const jumpTo=(player,prop,axis,holdJump,holdDirection)=>{
    const target=center(prop,axis);
    const velocity=axis==='x'?'jumpAirVX':'jumpAirVY';
    const sign=Math.sign(target-member(player)[axis]);
    holdJump(true);
    holdDirection(true);
    tick();
    waitUntil(()=>sign*(target-member(player)[axis])<Math.abs(actor(player)[velocity]||0)*.16,30);
    holdDirection(false);
    waitUntil(()=>!actor(player).jumpHeight,45);
    holdJump(false);
    tick();
    assert(actor(player).groundHeight===prop.surfaceHeight,player.name+' lands on the '+prop.id);
  };
  const streak=player=>lobby.state.furnitureStreaks.players.get(player.id);
  place(keyboard,center(stool,'x'),stool.y+stool.h+23);
  place(controller,center(bench,'x'),bench.y+bench.h+23);
  jumpTo(keyboard,stool,'y',pressed=>pressKey('J',pressed),pressed=>pressKey('W',pressed));
  assert(streak(keyboard)?.count===1&&!(streak(controller)?.count),
    'The first furniture landing starts only the keyboard explorer’s streak');
  jumpTo(keyboard,ottoman,'x',pressed=>pressKey('J',pressed),pressed=>pressKey('D',pressed));
  assert(streak(keyboard)?.count===2&&streak(keyboard)?.best===2,
    'Jumping directly onto another surface extends the streak');
  jumpTo(controller,bench,'y',pressed=>pressButton(0,pressed),pressed=>{pad.axes[1]=pressed?-1:0;});
  assert(streak(controller)?.count===1&&streak(controller)?.best===1&&streak(keyboard)?.count===2,
    'The simulated controller tracks a separate streak on the same course');
  pressKey('S',true);
  assert(waitUntil(()=>streak(keyboard)?.count===0), 'Landing on the floor ends the current streak');
  pressKey('S',false);
  assert(streak(keyboard)?.best===2&&streak(controller)?.count===1,
    'Ending one streak keeps its best and leaves the other explorer’s streak active');

  assert(profileSnapshot()===savedProfiles&&JSON.stringify(game.players.map(p=>[p.inventory,p.progress,p.xp]))===savedProgress,
    'All three activities leave saved profiles, inventory and expedition progression intact');
  assert(game.players.every(player=>!player.ready)&&lobby.state.countdown===null,
    'The activities do not ready anyone or start the expedition countdown');

  place(keyboard,151,309);
  place(controller,ball.x+29,ball.y+6,-1,0);
  tick();
  waitUntil(()=>!lobby.labels.some(label=>/\bBest \d+$/.test(label.text)),120);
  const labels=lobby.labels.map(label=>label.text);
  assert(labels.includes('E · ring')&&labels.includes('Y · kick'),
    'Visible action prompts display the matching keyboard and Xbox controls');

  return {checks,physicalControllersTested:false};
}
