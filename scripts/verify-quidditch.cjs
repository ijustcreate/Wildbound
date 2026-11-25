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
   const nativeAnimationFrame=window.requestAnimationFrame.bind(window);
   window.requestAnimationFrame=()=>0;window.Worker=undefined;
   const {Game}=await import('./src/core.mjs'),{Renderer}=await import('./src/render.mjs');
   const {enterWildLands}=await import('./src/wild-lands.mjs');
   const {ALLEY_SHOPS,ALLEY_PITCH_PORTKEY,alleyGate,alleyBlocked}=await import('./src/diagon-alley.mjs');
   const {QUIDDITCH_ROOM,QUIDDITCH_TRUNK,QUIDDITCH_RACK,QUIDDITCH_RETURN,QUIDDITCH_TEAMS,QUIDDITCH_HOOPS,quidditchFieldBlocked}=await import('./src/quidditch-layout.mjs');
   const {QUIDDITCH_COACH,quidditchVisualActor}=await import('./src/quidditch-scene.mjs');
   const {npcDialogueView,npcDialogueAction}=await import('./src/npc-quests.mjs');
   const {trainPrompt}=await import('./src/train-test.mjs');
   const {saveSession,restoreSession}=await import('./src/session.mjs');
   const {mirroredShopPoint}=await import('./src/diagon-shop-rooms.mjs');
   const {QUIDDITCH_TEAM_SHOP}=await import('./src/quidditch-team-shop.mjs');
   const {merchantRows}=await import('./src/traveling-merchant.mjs');
   const {petCard}=await import('./src/hunter-pet-ui.mjs');
   const {BACKPACK_SLOTS,count,give,stat}=await import('./src/items.mjs');
   const {broomFlightSpeed}=await import('./src/broom-mount.mjs');
   const {WIZARD_CARDS}=await import('./src/wizard-cards.mjs');
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
   t.noticeUntil=0;
   const shop=ALLEY_SHOPS.find(s=>s.id==='quidditch');point(shop.x-142,shop.y+11);keyboard({x:1},12);
   ok(hero.x>shop.x-108,'The broom shop is entered on foot');
   function selectStock(type){
    const row=merchantRows(game,hero).find(entry=>entry.item.type===type);
    if(!row)throw Error('Missing merchant stock '+type);
    game.inventoryAction(hero,'select:'+row.index);
    keyboard({use:true});keyboard();
    return row.price;
   }
   function useBackpackItem(type){
    const index=hero.inventory.findIndex(item=>item?.type===type);
    ok(index>=0,'The purchased '+type+' is in the backpack');
    game.inventoryAction(hero,'select:'+index);
    keyboard({use:true});keyboard();
   }
   hero.coins=1000;
   Object.assign(hero,mirroredShopPoint(shop,{x:65,y:13}));interact();
   ok(hero.ui?.alleyShop===shop.id&&merchantRows(game,hero).some(row=>row.item.type==='flying_broom'),'The first merchant still sells brooms');
   keyboard({close:true});keyboard();
   Object.assign(hero,mirroredShopPoint(shop,{x:7,y:43}));interact();
   ok(hero.ui?.alleyShop===QUIDDITCH_TEAM_SHOP&&game.trainTest.alleyMerchants[QUIDDITCH_TEAM_SHOP]?.name==='Elspeth Trewick','Live Interact opens Elspeth Trewick’s separate team outfitter');
   const kit=merchantRows(game,hero).map(row=>row.item.type);
   ok(['quidditch_gold_robe','quidditch_violet_robe','quidditch_gold_scarf','quidditch_violet_scarf','broom_speed_potion'].every(type=>kit.includes(type)),
    'The outfitter offers both team colors and the broom speed potion');
   capture('team-outfitter');
   const goldBeforeKit=hero.coins,usedGold=selectStock('quidditch_gold_robe')+selectStock('quidditch_gold_scarf')+selectStock('broom_speed_potion');
   ok(hero.coins===goldBeforeKit-usedGold,'The team outfitter charges the listed prices');
   keyboard({close:true});keyboard();
   keyboard({inventory:true});keyboard();
   for(const type of ['quidditch_gold_robe','quidditch_gold_scarf','broom_speed_potion'])useBackpackItem(type);
   ok(hero.equipment.chest==='quidditch_gold_robe'&&hero.equipment.back==='quidditch_gold_scarf','Both Gold team garments equip through the ordinary inventory');
   ok(!count(hero,'broom_speed_potion')&&hero.field.broomSpeedRemaining>295,'Using the potion consumes one bottle and starts the five-minute effect');
   keyboard({inventory:true});keyboard();

   point(ALLEY_PITCH_PORTKEY.x-6,ALLEY_PITCH_PORTKEY.y+14);
   ok(!alleyBlocked(game,hero.x,hero.y)&&trainPrompt(game,hero).includes('QUIDDITCH PITCH'),'The Portkey has a reachable interaction anchor in the shop');
   capture('shop-portkey');interact();
   ok(t.design.activeRoom===QUIDDITCH_ROOM,'The shop Portkey activates the pitch');
   ok(game.portalTransition.effect==='portkey','The arrival requests a visible Portkey warp');
   const match=t.quidditch,bag=JSON.stringify(hero.inventory);
   capture('pitch-arrival');
   point(7980,5450,0);
   const startX=hero.x,startStep=hero.step;
   keyboard({x:.45},5);
   ok(hero.x>startX&&hero.step>startStep&&hero.movementGait==='walk','The pitch uses the normal walk animation and step progression');
   keyboard({x:1},5);
   ok(hero.movementGait==='run'&&hero.moveSpeed>100,'Full stick movement uses the normal run gait');
   keyboard({x:1,jump:true},5);
   ok(hero.jumpHeight>15&&hero.jumpVelocity!==0,'A regular jump rises during movement on the pitch');
   keyboard({},20);
   const dashStart=hero.x;
   keyboard({x:1,dodge:true},3);
   ok(hero.dashTime>0&&hero.x-dashStart>26,'Grounded dodge uses the native dash');
   keyboard({},20);
   const shoulders=hero.equipment.shoulders,wingStart=hero.x;
   hero.equipment.shoulders='succubus_wings';
   keyboard({x:.65,jump:true},15);
   ok(hero.wingHover&&hero.jumpHeight>=40&&hero.x>wingStart+25,'Equipped wings lift, hover and move without a broom');
   capture('wing-hover');
   keyboard({},20);
   ok(!hero.wingHover&&hero.jumpHeight===0,'Releasing Jump returns the winged player to the field');
   hero.equipment.shoulders=shoulders;
   point(QUIDDITCH_COACH.x,QUIDDITCH_COACH.y+24,0);interact();
   ok(hero.ui?.quidditchTalk===QUIDDITCH_COACH.id,'The coach is reachable beside the entrance');
   npcDialogueAction(game,hero,'quidditch:rules');
   ok(npcDialogueView(game,hero).text.includes('press X'),'The coach explains the actual ball input');
   capture('entrance-coach');npcDialogueAction(game,hero,'close');
   point(QUIDDITCH_RACK.x+37,QUIDDITCH_RACK.y);interact();keyboard({},14);
   ok(hero.quidditchLoaner&&hero.broomMount&&hero.jumpHeight>30,'The rack offers a working loaner broom');
   ok(Math.abs(broomFlightSpeed(hero)/broomFlightSpeed({...hero,field:{}})-1.1)<.001,'The purchased potion boosts actual pitch broom speed by 10 percent');
   const initial=hero.jumpHeight;keyboard({jump:true},10);ok(hero.jumpHeight>initial+12,'Jump input climbs while flying');
   code('keydown','KeyK');const descend=tools.inputFrame();
   ok(descend.keyboard.broomDescend&&!descend.keyboard.dodge,'Native K descends separately from dash');
   for(let frame=0;frame<10;frame++)game.update(.05,descend);
   code('keyup','KeyK');ok(hero.jumpHeight<initial+23,'The new descent control lowers the broom');
   point(7980,5450,64);
   const cruiseStart=hero.x;
   keyboard({x:1});
   const cruiseDistance=hero.x-cruiseStart,boostStart=hero.x;
   code('keydown','KeyD');code('keydown','Space');
   const dashInput=tools.inputFrame();
   ok(dashInput.keyboard.dodge&&!dashInput.keyboard.broomDescend,'Native Space requests an airborne dash without descent');
   game.update(.05,dashInput);
   code('keyup','KeyD');code('keyup','Space');
   ok(hero.dashTime>0&&hero.x-boostStart>cruiseDistance*1.5&&hero.jumpHeight===64,'The loaner broom boosts while keeping its altitude');
   keyboard({},64);
   point(QUIDDITCH_TRUNK.x,QUIDDITCH_TRUNK.y+45,40);interact();
   ok(match.phase==='playing'&&match.bludgers.length===2,'Opening the trunk releases both Bludgers and starts play');
   ok(!game.blocked(QUIDDITCH_TRUNK.x,QUIDDITCH_TRUNK.y),'The chest leaves the playable field and no longer blocks movement');
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
    pad.buttons[2]={pressed:false,value:0};
    game.update(.025,tools.inputFrame());
    point(7800,5300,52);Object.assign(rival,{x:7829,y:5300,z:52,jumpHeight:52});
    Object.assign(match.quaffle,{holderId:rival.id,stealUntil:0,resetAt:0});
    pad.buttons[3]={pressed:true,value:1};
    const checkInputs=tools.inputFrame();
    ok(checkInputs['pad:0'].interact,'The controller Interact button routes to the Quaffle check');
    game.update(.025,checkInputs);
    ok(match.quaffle.holderId===null&&match.events.some(event=>event.type==='quaffle-knocked-loose'&&event.fromId===rival.id),'Controller Interact knocks the opponent’s Quaffle loose');
    pad.buttons[3]={pressed:false,value:0};
    point(match.quaffle.x,match.quaffle.y,match.quaffle.z);
    pad.buttons[2]={pressed:true,value:1};
    const recoveryInputs=tools.inputFrame();
    ok(recoveryInputs['pad:0'].quidditchBall,'Physical West reaches the pitch after knocking the ball loose');
    game.update(.025,recoveryInputs);
    ok(match.quaffle.holderId===String(hero.id),'Physical West grabs the dislodged Quaffle from the air');
    pad.buttons[2]={pressed:false,value:0};
    point(7980,5450,64);
    pad.buttons[13]={pressed:true,value:1};
    const lower=tools.inputFrame();
    ok(lower['pad:0'].broomDescend&&!lower['pad:0'].dodge,'Controller D-pad Down descends separately from dash');
    game.update(.05,lower);
    ok(hero.jumpHeight<64,'The controller lowers a broom during an active match');
    pad.buttons[13]={pressed:false,value:0};
    pad.axes[0]=1;pad.buttons[7]={pressed:true,value:1};
    const controllerBoost=tools.inputFrame(),controllerStart=hero.x;
    ok(controllerBoost['pad:0'].dodge&&!controllerBoost['pad:0'].broomDescend,'The default controller trigger requests a dash');
    game.update(.05,controllerBoost);
    ok(hero.dashTime>0&&hero.x-controllerStart>17,'The controller boosts a broom during an active match');
    pad.axes[0]=0;pad.buttons[7]={pressed:false,value:0};
    for(let frame=0;frame<10;frame++)game.update(.05,tools.inputFrame());
   }finally{
    if(originalPads)Object.defineProperty(navigator,'getGamepads',originalPads);else delete navigator.getGamepads;
    hero.device='keyboard';match.snitch.availableAt=savedAvailability;
   }
   if(match.time<4)keyboard({},Math.ceil((4-match.time)/.05));
   const paint=renderer.ctx,fillText=paint.fillText,fillRect=paint.fillRect;
   const labels=[],trailDots=[];
   paint.fillText=function(text,...args){labels.push(text);return fillText.call(this,text,...args);};
   paint.fillRect=function(x,y,w,h){
    if(['#ffe4a2','#e2b76b'].includes(this.fillStyle)&&w<=2&&h<=2&&this.globalAlpha<.65)trailDots.push([x,y]);
    return fillRect.call(this,x,y,w,h);
   };
   try{
    for(let frame=0;frame<8;frame++){
     point(match.snitch.x-140,match.snitch.y,match.snitch.z);
     keyboard();
     renderer.draw(game,.05);
    }
    checkTail();
    labels.length=0;
    capture('snitch-far');
    ok(!labels.some(text=>/catch snitch/i.test(text)),'The floating catch prompt is absent outside reach');
    labels.length=0;
    point(match.snitch.x,match.snitch.y,match.snitch.z+35);
    capture('snitch-too-high');
    ok(!labels.some(text=>/catch snitch/i.test(text)),'The catch prompt is absent at the wrong altitude');
    labels.length=0;
    point(match.snitch.x,match.snitch.y,match.snitch.z);
    capture('snitch-in-reach');
    ok(labels.includes('X · Catch Snitch'),'The true catch range draws a floating keyboard grab prompt');
    labels.length=0;
    hero.device='pad:0';hero.controllerFamily='playstation';
    capture('snitch-controller-prompt');
    ok(labels.some(text=>/Square · Catch Snitch/i.test(text)),'The floating prompt uses the controller West label');
   }finally{
    hero.device='keyboard';
    paint.fillText=fillText;paint.fillRect=fillRect;
   }
   function checkTail(){
    ok(new Set(trailDots.map(dot=>dot.join(','))).size>=3,'The free Snitch paints a fading gold particle tail along its flight path');
   }
   pitchX();
   ok(match.snitch.holderId===String(hero.id)&&match.phase==='playing','Catching the Snitch gives physical custody while play continues');
   point(7800,5300,52);Object.assign(rival,{x:7829,y:5300,z:52,jumpHeight:52});
   Object.assign(match.snitch,{holderId:rival.id,stealUntil:0});
   code('keydown','KeyF');game.update(.025,tools.inputFrame());code('keyup','KeyF');
   ok(match.snitch.holderId===String(hero.id)&&match.events.some(event=>event.type==='snitch-stolen'&&event.fromId===rival.id),'Native keyboard F steals a held Snitch while riding a broom');
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
   keyboard({block:true});keyboard();
   point(QUIDDITCH_COACH.x,QUIDDITCH_COACH.y+24,0);interact();
   ok(npcDialogueView(game,hero).npc?.name==='Madam Hooch','Madam Hooch still opens dialogue during play');
   function chooseCoach(label){
    const choice=npcDialogueView(game,hero).choices.findIndex(entry=>entry.label===label);
    if(choice<0)throw Error('Missing coach option '+label);
    game.inventoryAction(hero,'choice:'+choice);
   }
   chooseCoach('Stop this match and reset.');
   ok(match.phase==='playing','The stop request waits for confirmation');
   chooseCoach('End the match and put the chest back.');
   ok(match.phase==='waiting'&&!hero.ui&&game.blocked(QUIDDITCH_TRUNK.x,QUIDDITCH_TRUNK.y)&&
    Object.values(match.scores).every(score=>score===0),'Confirming with Madam Hooch restores the closed chest and resets the score');
   point(QUIDDITCH_TRUNK.x,QUIDDITCH_TRUNK.y+42,0);interact();
   ok(match.phase==='playing','The replaced chest starts a fresh match after the reset');
   point(QUIDDITCH_RETURN.x,QUIDDITCH_RETURN.y-31,0);interact();
   ok(t.design.activeRoom==='diagon'&&!hero.quidditchLoaner&&!hero.broomMount,'The return Portkey returns to the broom shop and clears the loaner');
   ok(game.portalTransition.effect==='portkey','The return requests the same visible Portkey warp');capture('portkey-return');
   ok(JSON.stringify(hero.inventory)===bag,'Neither balls nor loaners entered the player inventory');

   const owlery=ALLEY_SHOPS.find(s=>s.id==='eeylops');
   Object.assign(hero,mirroredShopPoint(owlery,{x:52,y:14}));interact();
   ok(hero.ui?.alleyShop==='eeylops','Live Interact opens Eeylops Owl Emporium');
   const goldBeforeOwl=hero.coins,owlPrice=selectStock('eeylops_hedwig_cage');
   ok(hero.coins===goldBeforeOwl-owlPrice&&hero.hunterPet?.owlVariant==='hedwig'&&hero.hunterPet.name==='Snowy Owl'&&!count(hero,'eeylops_hedwig_cage'),
    'Adopting the Snowy Owl activates a companion immediately and leaves no cage item');
   keyboard({close:true});keyboard();
   function openCare(){
    petCard(game,hero).querySelector('button').click();
    const dialog=document.querySelector('.pet-care-dialog[open]');
    if(!dialog)throw Error('Companion care did not open');
    return dialog;
   }
   const care=openCare();
   care.querySelector('input').value='Juniper';
   [...care.querySelectorAll('button')].find(button=>button.textContent==='Save name & collar').click();
   ok(hero.hunterPet.name==='Juniper','The normal Companion care form saves a custom owl name');
   interact();selectStock('eeylops_pigwidgeon_cage');keyboard({close:true});keyboard();
   ok(hero.hunterPet?.owlVariant==='pigwidgeon'&&hero.hunterPet.name==='Tiny Barn Owl','Adopting a second owl activates it without removing the first adoption');
   const switcher=openCare();
   [...switcher.querySelectorAll('button')].find(button=>button.textContent==='Switch to Juniper')?.click();
   ok(hero.hunterPet?.owlVariant==='hedwig'&&hero.hunterPet.name==='Juniper','Companion care switches back to the first owl with its saved name');
   if(switcher.open)switcher.close();
   keyboard({},8);
   capture('owlery-companion');

   const fortescue=ALLEY_SHOPS.find(shop=>shop.id==='floreans');
   Object.assign(hero,mirroredShopPoint(fortescue,{x:48,y:16}));interact();
   ok(hero.ui?.alleyShop==='floreans','Normal Interact opens Florean Fortescue’s counter');
   const creamTypes=['diagon_ice_cream_mint_chip','diagon_ice_cream_chocolate','diagon_ice_cream',
    'diagon_ice_cream_bertie_botts','diagon_ice_cream_moonberry'];
   const iceCreamStock=merchantRows(game,hero).map(row=>row.item.type);
   ok(creamTypes.every(type=>iceCreamStock.includes(type))&&iceCreamStock.includes('chocolate_frog'),
    'Fortescue stocks Strawberry, Mint Chip, Chocolate, Bertie Bott’s, and Moonberry ice creams, plus Chocolate Frogs');
   selectStock('diagon_ice_cream_chocolate');selectStock('diagon_ice_cream');
   selectStock('chocolate_frog');selectStock('chocolate_frog');
   keyboard({close:true});keyboard();
   keyboard({inventory:true});keyboard();
   const startingArmor=stat(hero,'armor');
   useBackpackItem('diagon_ice_cream_chocolate');
   ok(stat(hero,'armor')===startingArmor+2&&!count(hero,'diagon_ice_cream_chocolate')&&
    hero.field.fortescueIceCream?.remaining>89,'Eating Chocolate adds two armor for the flavor duration');
   hero.hp=30;
   useBackpackItem('diagon_ice_cream');
   ok(hero.hp>=65&&hero.hp<67&&hero.field.fortescueIceCream?.type==='diagon_ice_cream'&&
    stat(hero,'armor')===startingArmor&&!count(hero,'diagon_ice_cream'),'Eating Strawberry heals 35 HP and replaces the Chocolate effect');
   const findAlbum=player=>player.inventory.find(item=>item?.type==='wizard_card_collection');
   const originalRandom=game.random,frogCount=game.chocolateFrogs?.length||0;
   game.random=()=>.49;
   useBackpackItem('chocolate_frog');
   let album=findAlbum(hero);
   ok(game.chocolateFrogs.length===frogCount+1&&album?.contents?.length===1&&album.qty===1,
    'The escaped Chocolate Frog still grants a first card in one collection slot');
   game.random=()=>.99;
   useBackpackItem('chocolate_frog');
   album=findAlbum(hero);
   ok(album.contents.length===2&&new Set(album.contents.map(card=>card.type)).size===2&&count(hero,'wizard_card_collection')===1,
    'A second Chocolate Frog adds a distinct card to the same album');
   const drawAlbum=()=>{
    tools.heroUI.draw(game,renderer);
    return document.querySelector('.wizard-card-popover');
   };
   const navCard=(popup,direction)=>popup.querySelector('[data-nav="wizard-card-'+direction+'"]').click();
   const slotLabel=popup=>popup.querySelector('.wizard-card-navigation span')?.textContent;
   const collectedIds=new Set(album.contents.map(card=>card.type));
   const firstCollected=WIZARD_CARDS.findIndex(card=>collectedIds.has(card.id));
   useBackpackItem('wizard_card_collection');
   let popup=drawAlbum();
   ok(popup?.textContent.includes('2 / 20 collected · 18 missing')&&slotLabel(popup)===(firstCollected+1)+' / 20'&&
    popup.querySelector('h3')?.textContent===WIZARD_CARDS[firstCollected].name,
    'The partial album opens on the first collected catalog card and counts eighteen missing');
   const jumpButtons=[...popup.querySelectorAll('.wizard-card-slots button')];
   ok(jumpButtons.length===20&&jumpButtons.every((button,index)=>{
    const missing=!collectedIds.has(WIZARD_CARDS[index].id);
    return button.dataset.slot===String(index)&&button.classList.contains('is-missing')===missing&&
     (!missing||button.textContent.trim()==='?');
   }),'The partial album displays all twenty direct jumps and marks every missing slot with a question mark');
   jumpButtons[0].click();popup=drawAlbum();
   ok(hero.ui.wizardCards.index===0&&slotLabel(popup)==='1 / 20'&&popup.querySelector('.wizard-card-placeholder')?.textContent.includes('?'),
    'Selecting the first missing slot shows its question-mark card');
   navCard(popup,'prev');popup=drawAlbum();
   ok(hero.ui.wizardCards.index===19&&slotLabel(popup)==='20 / 20'&&popup.querySelector('h3')?.textContent===WIZARD_CARDS[19].name,
    'Previous wraps to slot twenty and displays its collected wizard');
   navCard(popup,'next');popup=drawAlbum();
   popup.dispatchEvent(new WheelEvent('wheel',{deltaY:100,bubbles:true,cancelable:true}));
   popup=drawAlbum();
   ok(hero.ui.wizardCards.index===1&&slotLabel(popup)==='2 / 20','The mouse wheel reaches a missing card slot');
   popup.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true,cancelable:true}));
   popup=drawAlbum();
   ok(hero.ui.wizardCards.index===0&&slotLabel(popup)==='1 / 20','The focused carousel accepts normal left arrow navigation');

   const slotViews=[];
   for(const [index,card] of WIZARD_CARDS.entries()){
    const name=popup.querySelector('h3')?.textContent;
    const missingMark=popup.querySelector('.wizard-card-placeholder')?.textContent.includes('?')&&name==='Uncollected card';
    const portrait=popup.querySelector('canvas.wizard-card-portrait');
    const collected=collectedIds.has(card.id);
    slotViews.push({index:hero.ui.wizardCards.index,label:slotLabel(popup),
     matches:collected?name===card.name&&!!portrait:missingMark&&!portrait});
    if(collected&&portrait&&!pictures['wizard-card-partial-known'])pictures['wizard-card-partial-known']=portrait.toDataURL();
    navCard(popup,'next');popup=drawAlbum();
   }
   ok(slotViews.length===20&&slotViews.every((view,index)=>view.matches&&view.index===index&&view.label===(index+1)+' / 20'),
    'All twenty slots follow catalog order, revealing collected wizards and showing a question mark for missing cards');
   ok(hero.ui.wizardCards.index===0,'Next wraps from slot twenty back to slot one');
   game.inventoryAction(hero,'close');
   ok(give(hero.inventory,'chocolate_frog'),'One frog is ready to open with a full backpack');
   const fillerSlots=[];
   while(hero.inventory.filter(Boolean).length<BACKPACK_SLOTS){
    const index=hero.inventory.findIndex(item=>!item);
    const slot=index<0?hero.inventory.length:index;
    hero.inventory[slot]={type:'hat',qty:1};fillerSlots.push(slot);
   }
   ok(hero.inventory.filter(Boolean).length===BACKPACK_SLOTS,'The explorer’s backpack is full');
   useBackpackItem('chocolate_frog');
   album=findAlbum(hero);
   ok(album.contents.length===3&&count(hero,'wizard_card_collection')===1,'A full backpack still adds the next card to the same album');
   for(const index of fillerSlots)hero.inventory[index]=null;
   ok(give(hero.inventory,'chocolate_frog',18),'The test explorer has enough frogs to finish the album and try one more');
   for(let opened=0;opened<18;opened++){
    const index=hero.inventory.findIndex(item=>item?.type==='chocolate_frog');
    game.inventoryAction(hero,'select:'+index);game.inventoryAction(hero,'use');
   }
   game.random=originalRandom;
   album=findAlbum(hero);
   ok(album.contents.length===20&&new Set(album.contents.map(card=>card.type)).size===20&&count(hero,'wizard_card_collection')===1&&!count(hero,'chocolate_frog'),
    'Opening more frogs completes exactly twenty distinct cards in one slot');
   const reloadedCollection=restoreSession(JSON.parse(JSON.stringify(saveSession(game)))).players[0];
   ok(JSON.stringify(findAlbum(reloadedCollection)?.contents)===JSON.stringify(album.contents),'A saved expedition restores the complete album');
   window.requestAnimationFrame=nativeAnimationFrame;
   useBackpackItem('wizard_card_collection');
   popup=drawAlbum();
   ok(hero.ui.wizardCards?.index===0&&popup?.textContent.includes('Chocolate Card Collection')&&popup.textContent.includes('20 / 20 collected')&&
    popup.querySelector('h3')?.textContent===WIZARD_CARDS[0].name,
    'Normal backpack Use opens the completed collection on the first wizard in catalog order');
   popup.querySelector('[data-nav="wizard-card-next"]').click();
   popup=drawAlbum();
   ok(hero.ui.wizardCards.index===1,'The popup’s Next button browses to the second card');
   popup.dispatchEvent(new WheelEvent('wheel',{deltaY:100,bubbles:true,cancelable:true}));
   popup=drawAlbum();
   ok(hero.ui.wizardCards.index===2,'Scrolling the popup browses to the next card');
   popup.querySelector('[data-nav="wizard-card-prev"]').click();
   popup=drawAlbum();
   ok(hero.ui.wizardCards.index===1,'The popup’s Previous button browses back');
   const portraitFrames=new Set();
   for(let frame=0;frame<6;frame++){
    await new Promise(resolve=>setTimeout(resolve,110));
    popup=drawAlbum();
    portraitFrames.add(popup.querySelector('.wizard-card-portrait')?.toDataURL());
   }
   ok(portraitFrames.size>1&&![...portraitFrames].includes(undefined),'The native wizard portrait animates in the open carousel');
   pictures['wizard-card-portrait']=popup.querySelector('.wizard-card-portrait').toDataURL();
   game.inventoryAction(hero,'close');
   window.requestAnimationFrame=()=>0;
   keyboard({inventory:true});keyboard();
   capture('fortescue-counter');
   return {pictures,checks};
  })()`);
  for(const [name,png] of Object.entries(result.pictures))fs.writeFileSync(path.join(output,name+'.png'),Buffer.from(png.split(',')[1],'base64'));
  const report={passed:result.checks.length,checks:result.checks,errors,muted:win.webContents.isAudioMuted()};
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({passed:report.passed,errors,muted:report.muted}));
  clearTimeout(deadline);app.exit(errors.length||!report.muted?1:0);
 }catch(error){console.error(error.stack,errors);clearTimeout(deadline);app.exit(1);}
});
