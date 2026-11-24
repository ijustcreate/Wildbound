const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');

const root=path.resolve(__dirname,'..');
const base=process.env.WILDBOUND_VERIFY_APP||root;
const output=path.join(root,'test-output','world-ground-items',base===root?'source':'packaged');
fs.mkdirSync(output,{recursive:true});
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'wildbound-ground-items-')));
app.commandLine.appendSwitch('mute-audio');
const deadline=setTimeout(()=>{
 console.error('Ground item verification timed out.');
 app.exit(1);
},120000);

app.whenReady().then(async()=>{
 const window=new BrowserWindow({show:false,width:1100,height:730,webPreferences:{backgroundThrottling:false}});
 window.webContents.setAudioMuted(true);
 const errors=[];
 window.webContents.on('console-message',event=>{
  if(event.level==='error')errors.push(event.message);
 });
 try{
  await window.loadFile(path.join(base,'index.html'),{query:{tools:'1'}});
  await window.webContents.executeJavaScript('wildboundBoot.ready');
  const checks=await window.webContents.executeJavaScript(`(${verifyGameplay})()`);
  const report={checks,errors,muted:window.webContents.isAudioMuted()};
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
  app.exit(errors.length||!report.muted?1:0);
 }catch(error){
  console.error(error.stack,errors);
  app.exit(1);
 }finally{
  clearTimeout(deadline);
 }
});

async function verifyGameplay(){
 window.requestAnimationFrame=()=>0;
 window.Worker=undefined;
 const {Game}=await import('./src/core.mjs');
 const {Renderer}=await import('./src/render.mjs');
 const {ALLEY,ALLEY_PITCH_PORTKEY,ALLEY_SHOPS,alleyGate}=await import('./src/diagon-alley.mjs');
 const {shopCutawayOpen}=await import('./src/diagon-shop-rooms.mjs');
 const {ARENA_ENTRANCES,ARENA_STAIRS,DIAGON_ARENA_ROOM}=await import('./src/diagon-arena-layout.mjs');
 const {QUIDDITCH_ROOM,QUIDDITCH_RETURN}=await import('./src/quidditch-layout.mjs');
 const {BACKPACK_SLOTS,count}=await import('./src/items.mjs');
 const {saveSession,restoreSession}=await import('./src/session.mjs');
 const {storageRoomLoot}=await import('./src/room-loot-data.mjs');
 const {enterWildLands}=await import('./src/wild-lands.mjs');
 const tools=wildboundPolishTest;
 const checks=[];
 function check(value,label){
  if(!value)throw Error(label);
  checks.push(label);
 }

 let game=new Game(()=>.5);
 let first=game.addPlayer('keyboard','Ground Item Tester');
 let second=game.addPlayer('pad:0','Ground Item Partner');
 game.start();
 game.openingBoard=false;
 tools.show('play');
 function useGame(){
  tools.game=game;
  game.spriteLibrary=tools.assets.library;
  game.persist=()=>{};
  game.onSound=()=>{};
 }
 useGame();
 check(enterWildLands(game,{persistent:true}).ok,'Started a two-player Wild Lands expedition');
 game.trainTest.preparing=false;
 first.inventory=[];
 second.inventory=[];

 const canvas=document.createElement('canvas');
 canvas.style.cssText='position:fixed;inset:0;width:1000px;height:690px';
 document.body.append(canvas);
 const renderer=new Renderer(canvas,tools.assets);
 renderer.setDynamicShadows(false);
 function step(inputs={}){
  game.update(.05,inputs);
 }
 function keyboard(...codes){
  for(const code of codes)document.dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true,cancelable:true}));
  step(tools.inputFrame());
  for(const code of codes)document.dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true,cancelable:true}));
  step(tools.inputFrame());
 }
 function controller(action){
  step({'pad:0':{[action]:true}});
  step();
 }
 function at(player,{x,y},dx=0,dy=0){
  Object.assign(player,{x:x+dx,y:y+dy});
 }
 const activeRoom=()=>game.trainTest.design.activeRoom;
 const itemOnGround=type=>game.loot.find(item=>item.type===type);
 function dropWithKeyboard(type,qty,one=false,findDrop=itemOnGround){
  first.inventory=[{type,qty}];
  keyboard('KeyI');
  check(first.ui?.panel==='pack','Keyboard I opens the backpack');
  keyboard(...(one?['ShiftLeft','Delete']:['Delete']));
  check(count(first,type)===(one?qty-1:0),'Keyboard removes the correct inventory quantity');
  keyboard('KeyI');
  const item=findDrop(type);
  check(item?.qty===(one?1:qty),'Ground receives the correct quantity');
  return item;
 }
 function groundSprite(item,label){
  const ctx=renderer.ctx;
  const ellipse=ctx.ellipse;
  let drewItem=false;
  ctx.ellipse=function(x,y,radius,...args){
   if(x===item.x&&y===item.y+6&&radius===9)drewItem=true;
   return ellipse.call(this,x,y,radius,...args);
  };
  try{
   renderer.trainScene=null;
   renderer.draw(game,.016);
  }finally{
   ctx.ellipse=ellipse;
  }
  check(drewItem,label);
 }

 const gate=alleyGate(game);
 const trailDrop=dropWithKeyboard('log',2);
 at(first,gate,0,55);
 first.equipment.hand1='starter_wand';
 keyboard('KeyE');
 for(let i=0;i<16;i++)step();
 keyboard('KeyE');
 check(activeRoom()==='diagon','Entered Diagon Alley using the wand and brick gate');
 check(!itemOnGround('log'),'Wild Lands drops stay outside Diagon Alley');

 const alleyPoint={x:8000,y:5200};
 at(first,alleyPoint);
 at(second,alleyPoint,25);
 const alleyPotion=dropWithKeyboard('potion',3,true);
 groundSprite(alleyPotion,'The dropped potion renders on the Alley street');
 second.inventory=Array.from({length:BACKPACK_SLOTS},()=>({type:'hat',qty:1}));
 at(second,alleyPotion,6);
 controller('loot');
 check(itemOnGround('potion')===alleyPotion,'A full backpack leaves the item in the Alley');
 second.inventory.pop();
 controller('loot');
 check(count(second,'potion')===1&&!itemOnGround('potion'),'The other player picks up the Alley drop when space is available');
 second.inventory=[];

 const broomShop=ALLEY_SHOPS.find(shop=>shop.id==='quidditch');
 at(first,broomShop,-86,6);
 at(second,broomShop,-85,13);
 check([first,second].every(player=>shopCutawayOpen(broomShop,[player])&&!game.blocked(player.x,player.y)),
  'Both players are on the walkable shop floor inside Quality Quidditch Supplies');
 const shopDrop=dropWithKeyboard('arrow',4);
 check(shopCutawayOpen(broomShop,[shopDrop]),'The dropped arrows land on the shop floor');
 at(second,shopDrop,-6);
 controller('loot');
 check(count(second,'arrow')===4&&!itemOnGround('arrow'),'The other player collects the arrows inside the shop');

 at(first,alleyPoint);
 at(second,alleyPoint,0,12);
 Object.assign(first,{faceX:1,faceY:0});
 keyboard('KeyP');
 const door=game.portals.find(door=>door.owner===first.id&&door.railwayScene==='diagon');
 check(door,'Keyboard P opens a real storage portal in Diagon Alley');
 for(let i=0;i<15;i++){
  const towardDoor=player=>{
   if(player.room)return {};
   const x=door.x-player.x,y=door.y-player.y,distance=Math.max(1,Math.hypot(x,y));
   return {x:x/distance,y:y/distance};
  };
  step({keyboard:towardDoor(first),'pad:0':towardDoor(second)});
 }
 check(first.room===door.id&&second.room===door.id,'Both players enter the same Alley storeroom');
 const storageDrop=dropWithKeyboard('coconut',1,false,type=>storageRoomLoot(game,door).find(item=>item.type===type));
 check(!itemOnGround('coconut'),'A storeroom drop stays inside the room');
 const canvasPrototype=CanvasRenderingContext2D.prototype;
 const originalEllipse=canvasPrototype.ellipse;
 let drewStorageDrop=false;
 canvasPrototype.ellipse=function(x,y,radius,...args){
  if(x===storageDrop.x&&y===storageDrop.y+2&&Math.abs(radius-6.6)<.01)drewStorageDrop=true;
  return originalEllipse.call(this,x,y,radius,...args);
 };
 try{
  tools.heroUI.draw(game,renderer);
 }finally{
  canvasPrototype.ellipse=originalEllipse;
 }
 check(drewStorageDrop&&document.querySelector('.private-storage-room canvas'),'The storage room renderer paints the dropped item');
 Object.assign(second,{roomX:storageDrop.x+6,roomY:storageDrop.y});
 controller('loot');
 check(count(second,'coconut')===1&&!storageRoomLoot(game,door).length,'The other player collects the drop from the shared storeroom floor');
 controller('portal');
 keyboard('KeyP');
 check(!first.room&&!second.room,'Both players return to Diagon Alley from the storeroom');

 at(first,alleyPoint);
 at(second,alleyPoint,25);
 const alleyStone=dropWithKeyboard('stone',2);

 at(first,ALLEY_PITCH_PORTKEY,-6,14);
 keyboard('KeyE');
 check(activeRoom()===QUIDDITCH_ROOM,'Entered the Quidditch pitch through the shop Portkey');
 at(first,alleyStone);
 at(second,alleyStone,25);
 keyboard('KeyE');
 check(!itemOnGround('stone')&&!count(first,'stone'),'An Alley item cannot be collected at the same coordinates in Quidditch');
 second.inventory=[{type:'fruit',qty:3}];
 controller('inventory');
 controller('store');
 check(count(second,'fruit')===0,'The controller inventory action drops a full stack on the pitch');
 controller('inventory');
 const fruit=itemOnGround('fruit');
 check(fruit?.qty===3,'The pitch receives the full stack');
 groundSprite(fruit,'The dropped fruit renders on the Quidditch pitch');
 at(first,fruit,7);
 keyboard('KeyE');
 check(count(first,'fruit')===3&&!itemOnGround('fruit'),'Keyboard E collects the other player’s full stack on the pitch');

 at(first,alleyPoint);
 at(second,alleyPoint,28);
 const pitchApple=dropWithKeyboard('apple',1);
 at(first,QUIDDITCH_RETURN,0,-30);
 keyboard('KeyE');
 check(activeRoom()==='diagon'&&!itemOnGround('apple'),'The pitch drop stays behind when using the return Portkey');
 check(itemOnGround('stone')?.id===alleyStone.id,'Returning to Diagon Alley restores the same ground item');

 at(first,ARENA_ENTRANCES['meridian-hall']);
 keyboard('KeyE');
 check(activeRoom()===DIAGON_ARENA_ROOM,'Entered the Lamplit Vault from Meridian Hall');
 at(second,first,25);
 second.inventory=[{type:'relic_bag',qty:1,contents:[{type:'jade_scarab',qty:1}]}];
 controller('inventory');
 controller('store');
 check(count(second,'relic_bag')===0,'The controller drops a relic bag from the backpack in the Vault');
 controller('inventory');
 const bag=itemOnGround('relic_bag');
 check(bag?.contents?.[0]?.type==='jade_scarab','Dropping the bag preserves its contents');
 groundSprite(bag,'The relic bag renders on the Vault floor');
 at(first,bag,6);
 keyboard('KeyE');
 check(first.inventory.some(item=>item?.type==='relic_bag'&&item.contents?.[0]?.type==='jade_scarab'),'The other player retrieves the bag with its contents');
 at(first,{x:8150,y:5000});
 dropWithKeyboard('coconut',2);
 at(first,ARENA_STAIRS,0,-14);
 keyboard('KeyE');
 check(activeRoom()==='diagon'&&!itemOnGround('coconut'),'A Vault drop stays in the Vault when the party leaves');

 at(first,ALLEY.entry,0,-26);
 keyboard('KeyE');
 check(!activeRoom()&&itemOnGround('log')?.id===trailDrop.id,'Returning to the Wild Lands restores the original trail drop');
 at(first,gate,0,55);
 keyboard('KeyE');
 check(activeRoom()==='diagon'&&itemOnGround('stone')?.id===alleyStone.id,'The Alley drop survives a full round trip to the Wild Lands');

 game=restoreSession(JSON.parse(JSON.stringify(saveSession(game))));
 [first,second]=game.players;
 useGame();
 game.trainTest.preparing=false;
 check(activeRoom()==='diagon'&&itemOnGround('stone')?.id===alleyStone.id,'The Alley drop survives loading an expedition checkpoint');
 at(first,ALLEY_PITCH_PORTKEY,-6,14);
 keyboard('KeyE');
 check(activeRoom()===QUIDDITCH_ROOM&&itemOnGround('apple')?.id===pitchApple.id,'The inactive pitch drop survives loading and revisiting');
 at(second,pitchApple,8);
 controller('loot');
 check(count(second,'apple')===1&&!itemOnGround('apple'),'The second player collects the restored pitch drop with the controller');
 at(first,QUIDDITCH_RETURN,0,-30);
 keyboard('KeyE');
 at(first,ARENA_ENTRANCES['meridian-hall']);
 keyboard('KeyE');
 check(activeRoom()===DIAGON_ARENA_ROOM&&itemOnGround('coconut')?.qty===2,'The inactive Vault drop survives loading and revisiting');
 return checks;
}
