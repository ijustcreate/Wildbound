const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base=process.env.WILDBOUND_VERIFY_APP||root;
const output=path.join(root,'test-output','quidditch-match',base===root?'source':'packaged');
fs.mkdirSync(output,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-quidditch-')));
app.commandLine.appendSwitch('mute-audio');
const deadline=setTimeout(()=>app.exit(1),140000);

app.whenReady().then(async()=>{
 const win=new BrowserWindow({show:false,width:1200,height:790,webPreferences:{backgroundThrottling:false}});
 win.webContents.setAudioMuted(true);
 const errors=[];
 win.webContents.on('console-message',event=>{if(event.level==='error')errors.push(event.message);});
 try{
  await win.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});
  await win.webContents.executeJavaScript('wildboundBoot.ready');
  const result=await win.webContents.executeJavaScript(`(async()=>{
   window.requestAnimationFrame=()=>0;window.Worker=undefined;
   const {Game}=await import('./src/core.mjs'),{Renderer}=await import('./src/render.mjs');
   const {enterWildLands}=await import('./src/wild-lands.mjs');
   const {ALLEY_SHOPS,ALLEY_PITCH_PORTKEY,alleyGate,alleyBlocked}=await import('./src/diagon-alley.mjs');
   const {QUIDDITCH_ROOM,QUIDDITCH_TRUNK,QUIDDITCH_RACK,QUIDDITCH_RETURN,QUIDDITCH_TEAMS,QUIDDITCH_HOOPS,quidditchFieldBlocked}=await import('./src/quidditch-layout.mjs');
   const {QUIDDITCH_COACH,quidditchVisualActor}=await import('./src/quidditch-scene.mjs');
   const {npcDialogueView,npcDialogueAction}=await import('./src/npc-quests.mjs');
   const {trainPrompt}=await import('./src/train-test.mjs');
   const {saveSession,restoreSession}=await import('./src/session.mjs');
   const game=new Game(()=>.5),hero=game.addPlayer('keyboard','Pitch tester');game.start();game.openingBoard=false;
   const tools=wildboundPolishTest,assets=tools.assets;tools.game=game;tools.show('play');game.spriteLibrary=assets.library;game.persist=()=>{};game.onSound=()=>{};
   const pictures={},checks=[],ok=(value,label)=>{if(!value)throw new Error(label);checks.push(label);};
   const keyboard=(input={},frames=1)=>{for(let i=0;i<frames;i++)game.update(.05,{keyboard:input});};
   const interact=()=>{keyboard();keyboard({interact:true});};
   const code=(type,key)=>document.dispatchEvent(new KeyboardEvent(type,{code:key,bubbles:true,cancelable:true}));
   const pitchX=()=>{code('keydown','KeyX');const inputs=tools.inputFrame();ok(inputs.keyboard.quidditchBall,'Native KeyX becomes the pitch ball action');game.update(.05,inputs);code('keyup','KeyX');game.update(.025,tools.inputFrame());};
   function point(x,y,z){Object.assign(hero,{x,y});if(z!=null){hero.jumpHeight=z;hero.quidditchAltitude=z;}}
   const canvas=document.createElement('canvas');canvas.style.cssText='width:1180px;height:770px';document.body.append(canvas);
   const renderer=new Renderer(canvas,assets);renderer.dynamicShadows=false;
   const capture=name=>{renderer.trainScene=null;renderer.draw(game,.016);pictures[name]=canvas.toDataURL();};
   ok(enterWildLands(game,{persistent:true}).ok,'Starts the normal Wilds world');
   const t=game.trainTest;t.preparing=false;const gate=alleyGate(game);
   hero.equipment.hand1='starter_wand';point(gate.x,gate.y+55);interact();keyboard({},16);interact();
   ok(t.design.activeRoom==='diagon','Actual Interact enters Diagon Alley');
   const shop=ALLEY_SHOPS.find(s=>s.id==='quidditch');point(shop.x-142,shop.y+11);keyboard({x:1},12);
   ok(hero.x>shop.x-108,'The broom shop is entered on foot');
   point(ALLEY_PITCH_PORTKEY.x-6,ALLEY_PITCH_PORTKEY.y+14);
   ok(!alleyBlocked(game,hero.x,hero.y)&&trainPrompt(game,hero).includes('QUIDDITCH PITCH'),'The Portkey has a reachable interaction anchor in the shop');
   capture('shop-portkey');interact();
   ok(t.design.activeRoom===QUIDDITCH_ROOM,'The shop Portkey activates the pitch');
   ok(game.portalTransition.effect==='portkey','The arrival requests a visible Portkey warp');
   const match=t.quidditch,bag=JSON.stringify(hero.inventory);
   capture('pitch-arrival');
   point(QUIDDITCH_COACH.x,QUIDDITCH_COACH.y+24,0);interact();
   ok(hero.ui?.quidditchTalk===QUIDDITCH_COACH.id,'The coach is reachable beside the entrance');
   npcDialogueAction(game,hero,'quidditch:rules');
   ok(npcDialogueView(game,hero).text.includes('press X'),'The coach explains the actual ball input');
   capture('entrance-coach');npcDialogueAction(game,hero,'close');
   point(QUIDDITCH_RACK.x+37,QUIDDITCH_RACK.y);interact();keyboard({},14);
   ok(hero.quidditchLoaner&&hero.broomMount&&hero.jumpHeight>30,'The rack offers a working loaner broom');
   const initial=hero.jumpHeight;keyboard({jump:true},10);ok(hero.jumpHeight>initial+12,'Jump input climbs while flying');
   keyboard({dodge:true},10);ok(hero.jumpHeight<initial+23,'Dodge input descends while flying');
   point(QUIDDITCH_TRUNK.x,QUIDDITCH_TRUNK.y+45,40);interact();
   ok(match.phase==='playing'&&match.bludgers.length===2,'Opening the trunk releases both Bludgers and starts play');
   capture('balls-released');
   point(match.quaffle.x,match.quaffle.y+12,Math.max(28,match.quaffle.z));pitchX();
   ok(match.quaffle.holderId===String(hero.id)&&JSON.stringify(hero.inventory)===bag,'An airborne player catches and carries the Quaffle in the world');
   ok(quidditchVisualActor(hero).equipment.hand1===null&&hero.equipment.hand1==='starter_wand','Pitch art hides the equipped wand without removing it');
   const hoop=QUIDDITCH_HOOPS.find(h=>h.team==='violet'&&h.z===74);
   point(hoop.x-155,hoop.y,hoop.z-4);keyboard({aimX:1,aimY:0},1);keyboard({aimX:1,aimY:0,attack:true});
   ok(match.quaffle.holderId===String(hero.id),'Regular weapon attack does nothing in the pitch');
   pitchX();ok(match.quaffle.holderId===null,'Pitch X throws the Quaffle');
   keyboard({},16);
   ok(match.scores.gold===1&&match.scores.violet===0,'A thrown Quaffle scores one point in the opposing hoop');
   capture('goal-scored');
   const rival=match.ai.find(a=>a.team==='violet'),savedAvailability=match.snitch.availableAt;
   point(7800,5300,52);Object.assign(rival,{x:7829,y:5300,z:52,jumpHeight:52});
   match.snitch.availableAt=match.time+9;match.quaffle.holderId=rival.id;
   const originalPads=Object.getOwnPropertyDescriptor(navigator,'getGamepads');
   const pad={index:0,id:'Xbox Wireless Controller',mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
   Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[pad]});hero.device='pad:0';
   try{
    game.update(.025,tools.inputFrame());pad.buttons[2]={pressed:true,value:1};
    const inputs=tools.inputFrame();ok(inputs['pad:0'].quidditchBall,'Physical controller West becomes the pitch ball action');
    game.update(.025,inputs);
    ok(match.quaffle.holderId===String(hero.id)&&match.events.some(event=>event.type==='quaffle-stolen'&&event.fromId===rival.id),'Physical West steals from a nearby opposing NPC');
   }finally{
    if(originalPads)Object.defineProperty(navigator,'getGamepads',originalPads);else delete navigator.getGamepads;
    hero.device='keyboard';match.snitch.availableAt=savedAvailability;
   }
   if(match.time<4)keyboard({},Math.ceil((4-match.time)/.05));
   point(match.snitch.x,match.snitch.y,match.snitch.z);pitchX();
   ok(match.snitch.holderId===String(hero.id)&&match.phase==='playing','Catching the Snitch gives physical custody while play continues');
   const wrong=QUIDDITCH_TEAMS.violet.home;point(wrong.x-34,wrong.y,39);interact();
   ok(match.phase==='playing','The opponent’s stand cannot take the Snitch');
   const home=QUIDDITCH_TEAMS.gold.home;point(home.x,home.y,40);interact();
   ok(match.phase==='finished'&&match.winner==='gold'&&match.scores.gold===4,'Own stand records the Snitch, awards three points, and announces Gold wins');
   ok([match.quaffle,match.snitch,...match.bludgers].every(b=>b.x===QUIDDITCH_TRUNK.x&&b.y===QUIDDITCH_TRUNK.y&&b.z===0),'All four balls return to the closed chest');
   keyboard({block:true});
   ok(!hero.broomMount&&!quidditchFieldBlocked(hero.x,hero.y,8),'Dismount at the pedestal settles the explorer beside it');
   for(let i=0;i<150;i++)keyboard();
   const rider=match.ai.find(a=>a.team==='gold');
   ok(match.ai.every(a=>a.landed&&a.jumpHeight===0&&!a.broomMount),'The five NPC teammates and opponents finish on foot');
   point(rider.x,rider.y+21,0);interact();ok(npcDialogueView(game,hero).text.includes('another match'),'A landed rider says good game and points back to the chest');npcDialogueAction(game,hero,'close');
   capture('gold-wins');
   point(home.x,home.y,0);
   const restored=restoreSession(JSON.parse(JSON.stringify(saveSession(game))));
   ok(restored.trainTest.design.activeRoom===QUIDDITCH_ROOM&&restored.trainTest.quidditch.scores.gold===4,'A saved pitch restores its final score and active room');
   restored.trainTest.preparing=false;restored.persist=()=>{};restored.onSound=()=>{};
   const reloaded=restored.players[0];
   restored.update(.05,{keyboard:{x:1}});
   ok(!quidditchFieldBlocked(reloaded.x,reloaded.y,8)&&!reloaded.broomMount,'A legacy grounded save centered on the pedestal exits the collider');
   function walkTo(target){
    for(let i=0;i<220&&Math.hypot(reloaded.x-target.x,reloaded.y-target.y)>5;i++){
     const dx=target.x-reloaded.x,dy=target.y-reloaded.y,span=Math.max(7,Math.hypot(dx,dy));
     restored.update(.05,{keyboard:{x:dx/span,y:dy/span}});
    }
    return Math.hypot(reloaded.x-target.x,reloaded.y-target.y)<=6;
   }
   ok(walkTo({x:QUIDDITCH_TRUNK.x,y:home.y+42})&&walkTo({x:QUIDDITCH_TRUNK.x,y:QUIDDITCH_TRUNK.y+42}),'The restored hero can walk from the stand to the match chest');
   ok(walkTo({x:QUIDDITCH_RETURN.x,y:QUIDDITCH_RETURN.y-33}),'The restored hero can walk onward to the return Portkey');
   point(QUIDDITCH_TRUNK.x,QUIDDITCH_TRUNK.y+42,39);interact();
   ok(match.round===2&&match.phase==='playing'&&match.scores.gold===0,'The central trunk restarts a fresh match');
   point(QUIDDITCH_RETURN.x,QUIDDITCH_RETURN.y-31,39);interact();
   ok(t.design.activeRoom==='diagon'&&!hero.quidditchLoaner&&!hero.broomMount,'The return Portkey returns to the broom shop and clears the loaner');
   ok(game.portalTransition.effect==='portkey','The return requests the same visible Portkey warp');capture('portkey-return');
   ok(JSON.stringify(hero.inventory)===bag,'Neither balls nor loaners entered the player inventory');
   return {pictures,checks};
  })()`);
  for(const [name,png] of Object.entries(result.pictures))fs.writeFileSync(path.join(output,name+'.png'),Buffer.from(png.split(',')[1],'base64'));
  const report={passed:result.checks.length,checks:result.checks,errors,muted:win.webContents.isAudioMuted()};
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({passed:report.passed,errors,muted:report.muted}));
  clearTimeout(deadline);app.exit(errors.length||!report.muted?1:0);
 }catch(error){console.error(error.stack,errors);clearTimeout(deadline);app.exit(1);}
});
