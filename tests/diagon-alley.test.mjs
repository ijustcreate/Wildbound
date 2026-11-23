import test from 'node:test';import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';import {enterWildLands} from '../src/wild-lands.mjs';import {leaveTrainTest,trainInteraction,trainWorldBlocked} from '../src/train-test.mjs';
import {alleyGate,interactAlley,ALLEY_SHOPS,alleyBlocked,inDiagon} from '../src/diagon-alley.mjs';import {merchantAction,merchantRows} from '../src/traveling-merchant.mjs';
import {ALLEY_SHOP_ROOMS, mirroredShopPoint, shopCutawayOpen} from '../src/diagon-shop-rooms.mjs';
import {alleyShopAssets} from '../src/diagon-shop-scenes.mjs';
import {stationOwlCages,openOwlCage,tickStationOwls,catchStationOwl,releaseStationOwl} from '../src/station-owls.mjs';import {give,ITEMS} from '../src/items.mjs';import {snapPortalCamera,spellTransition} from '../src/portal-transition.mjs';import {wildLandsInteract} from '../src/wild-lands-world.mjs';
const count=(p,t)=>p.inventory.filter(a=>a?.type===t).reduce((v,a)=>v+a.qty,0);
function setup(){const g=new Game(()=>.5),original=g.addPlayer('keyboard');g.phase='play';g.openingBoard=false;g.persist=()=>{};g.onSound=()=>{};assert.ok(enterWildLands(g).ok);g.trainTest.preparing=false;return {g,p:g.players[0],original};}
function enter(g,p){const gate=alleyGate(g);Object.assign(p,{x:gate.x,y:gate.y+60});p.equipment.hand1='starter_wand';assert.ok(trainInteraction(g,p));g.trainTest.time+=1;assert.ok(trainInteraction(g,p));assert.ok(inDiagon(g));}
test('station brick wall requires a held wand, opens, and transfers the whole party instantly',()=>{const {g,p}=setup(),gate=alleyGate(g);Object.assign(p,{x:gate.x,y:gate.y+55});p.equipment.hand1='sword';assert.ok(interactAlley(g,p));assert.ok(!g.trainTest.alleyOpened);assert.ok(alleyBlocked(g,gate.x,gate.y));enter(g,p);assert.equal(p.x,8000);assert.equal(p.y,5560);assert.ok(g.portalTransition.serial);assert.equal(wildLandsInteract(g,p),false);Object.assign(p,{x:8000,y:5660});assert.ok(interactAlley(g,p));assert.ok(!inDiagon(g));assert.equal(p.x,gate.x);assert.equal(p.y,gate.y+65);});
test('all eight businesses have reachable interiors, valid goods, and solid walls',()=>{const {g,p}=setup();enter(g,p);assert.equal(ALLEY_SHOPS.length,8);for(const s of ALLEY_SHOPS){const x=s.x+(s.x<8000?130:-130);assert.equal(alleyBlocked(g,x,s.y+12),false,s.id);assert.equal(alleyBlocked(g,s.x+(s.x<8000?108:-108),s.y),false);assert.equal(alleyBlocked(g,s.x,s.y-82),true);for(const [type]of s.stock)assert.ok(ITEMS[type],type);Object.assign(p,{x,y:s.y+12});assert.ok(interactAlley(g,p));if(s.stock.length)assert.equal(merchantRows(g,p).length,s.stock.length);p.ui=null;}assert.equal(trainWorldBlocked(g,7000,4500),true);});
test('alley purchases charge once and carry back, full bag and poor buyers do not lose money',()=>{const {g,p,original}=setup();original.coins=p.coins=500;enter(g,p);const s=ALLEY_SHOPS[0];Object.assign(p,{x:s.x+130,y:s.y+12});interactAlley(g,p);const start=p.coins;merchantAction(g,p,'use');assert.equal(count(p,'starter_wand'),1);assert.equal(p.coins,start-35);p.coins=0;merchantAction(g,p,'use');assert.equal(count(p,'starter_wand'),1);leaveTrainTest(g);assert.equal(count(original,'starter_wand'),1);assert.equal(original.coins,465);});
test('Gringotts rejects sandbox-only essence without crediting permanent gold',()=>{const {g,p,original}=setup();give(p.inventory,'dark_essence',5);original.coins=p.coins=10;enter(g,p);const shop=ALLEY_SHOPS.find(s=>s.id==='gringotts');Object.assign(p,{x:shop.x-130,y:shop.y+12});assert.ok(interactAlley(g,p));assert.equal(count(p,'dark_essence'),5);assert.equal(p.coins,10);leaveTrainTest(g);assert.equal(original.coins,10);});
test('Gringotts exchange is atomic and transfers net essence/gold back to expedition',()=>{const {g,p,original}=setup();give(original.inventory,'dark_essence',5);give(p.inventory,'dark_essence',5);original.coins=p.coins=10;enter(g,p);const s=ALLEY_SHOPS.find(s=>s.id==='gringotts');Object.assign(p,{x:s.x-130,y:s.y+12});interactAlley(g,p);assert.equal(count(p,'dark_essence'),0);assert.equal(p.coins,35);interactAlley(g,p);assert.equal(p.coins,35);leaveTrainTest(g);assert.equal(original.coins,35);assert.equal(count(original,'dark_essence'),0);});
test('a station owl is released once, follows, flies, lands, and needs a cage to recapture',()=>{const {g,p}=setup(),c=stationOwlCages(g)[0];assert.ok(c);Object.assign(p,{x:c.x,y:c.y+35});assert.ok(openOwlCage(g,p));tickStationOwls(g,.05);assert.equal(g.stationOwls.length,1);assert.ok(!openOwlCage(g,p));const a=g.stationOwls[0];p.x+=180;p.moving=true;for(let i=0;i<120;i++)tickStationOwls(g,.05);assert.ok(Math.hypot(a.x-p.x,a.y-p.y)<70);assert.ok(a.owlHeight>0);p.moving=false;for(let i=0;i<120;i++)tickStationOwls(g,.05);assert.equal(a.owlPhase,'perch');assert.equal(a.owlHeight,0);p.equipment.hand1='critter_net';assert.ok(catchStationOwl(g,p));assert.ok(p.npcQuests.snowy_owl.active);give(p.inventory,'critter_cage');assert.ok(catchStationOwl(g,p));assert.equal(count(p,'caught_snowy_owl'),1);assert.equal(count(p,'critter_cage'),0);assert.ok(!p.npcQuests.snowy_owl.active);const i=p.inventory.findIndex(a=>a?.type==='caught_snowy_owl');assert.ok(releaseStationOwl(g,p,i));assert.ok(p.npcQuests.snowy_owl.active);assert.equal(count(p,'critter_cage'),1);assert.equal(count(p,'caught_snowy_owl'),0);});
test('owl adoption and net cage contents survive returning to expedition and a profile clone',()=>{const {g,p,original}=setup(),c=stationOwlCages(g)[0];give(original.inventory,'critter_cage');give(p.inventory,'critter_cage');Object.assign(p,{x:c.x,y:c.y});openOwlCage(g,p);tickStationOwls(g,.01);p.equipment.hand1='critter_net';catchStationOwl(g,p);leaveTrainTest(g);assert.equal(count(original,'caught_snowy_owl'),1);assert.equal(count(original,'critter_cage'),0);assert.equal(original.npcQuests.snowy_owl.active,false);const record=structuredClone(original.npcQuests);assert.equal(record.snowy_owl.name,'Snowy Owl');});
test('portal epoch snaps camera on first destination draw with no intermediate pan',()=>{const g={players:[],onSound(){}},r={camera:{x:50,y:80,zoom:1}};snapPortalCamera(r,g,{x:50,y:80,zoom:1});spellTransition(g);assert.equal(snapPortalCamera(r,g,{x:8000,y:5560,zoom:1.35}),true);assert.deepEqual(r.camera,{x:8000,y:5560,zoom:1.35});assert.equal(snapPortalCamera(r,g,{x:20,y:20,zoom:1}),false);});

test('walks through the new wand-shop threshold and meets the visible counter and back wall',()=>{
 const {g,p}=setup();enter(g,p);
 const s=ALLEY_SHOPS[0];
 Object.assign(p,{x:s.x+147,y:s.y+9});
 for(let i=0;i<12;i++)g.update(.05,{keyboard:{x:-1}});
 assert.ok(p.x<s.x+99,'crosses the east threshold');
 Object.assign(p,{x:s.x+71,y:s.y+22});
 for(let i=0;i<18&&p.x>s.x+22;i++)g.update(.05,{keyboard:{x:-1}});
 assert.ok(Math.abs(p.x-s.x)<45,'reaches the customer side of the counter');
 for(let i=0;i<18;i++)g.update(.05,{keyboard:{y:-1}});
 assert.ok(p.y>=s.y-5,'counter stops movement on its front edge');
 Object.assign(p,{x:s.x+89,y:s.y-58});
 for(let i=0;i<18;i++)g.update(.05,{keyboard:{y:-1}});
 assert.ok(p.y>s.y-82,'back wall stays solid');
 assert.equal(alleyBlocked(g,s.x+108,s.y+44),true,'east wall beside entrance stays solid');
 assert.equal(alleyBlocked(g,s.x-76,s.y-66),true,'shelf has its own footprint');
});
test('a cage purchased in the alley can hold the station owl without duplicating the empty cage on return',()=>{const {g,p,original}=setup();original.coins=p.coins=100;enter(g,p);const s=ALLEY_SHOPS.find(s=>s.id==='eeylops');Object.assign(p,{x:s.x-130,y:s.y+12});interactAlley(g,p);merchantAction(g,p,'use');assert.equal(count(p,'critter_cage'),1);p.ui=null;Object.assign(p,{x:8000,y:5660});interactAlley(g,p);const c=stationOwlCages(g)[0];Object.assign(p,{x:c.x,y:c.y});openOwlCage(g,p);tickStationOwls(g,.01);p.equipment.hand1='critter_net';catchStationOwl(g,p);leaveTrainTest(g);assert.equal(count(original,'critter_cage'),0);assert.equal(count(original,'caught_snowy_owl'),1);assert.equal(original.coins,92);});

test('legacy portal-sized position cuts also snap and flash without explicit new API calls',()=>{const g={players:[{id:1,x:10,y:10}],onSound(){}},r={camera:{x:10,y:10,zoom:1}};snapPortalCamera(r,g,r.camera);g.players[0].x=9000;assert.ok(snapPortalCamera(r,g,{x:9000,y:10,zoom:1}));assert.equal(r.camera.x,9000);g.players[0].x+=5;assert.equal(snapPortalCamera(r,g,{x:9005,y:10,zoom:1}),false);});

test('owl keeps a nonzero travel heading when it reaches its follow point in one step and turns through all views',()=>{const {g,p}=setup();p.npcQuests={snowy_owl:{active:true}};p.moving=true;tickStationOwls(g,.05);const a=g.stationOwls[0];for(let direction=0;direction<8;direction++){const angle=direction*Math.PI/4,dx=Math.cos(angle),dy=Math.sin(angle);for(let i=0;i<18;i++){a.x=p.x-26-dx*2;a.y=p.y+22-dy*2;tickStationOwls(g,.05);assert.ok(Math.hypot(a.faceX,a.faceY)>.99);}assert.ok(a.faceX*dx+a.faceY*dy>.99,'follows heading '+direction);const old=[a.faceX,a.faceY];tickStationOwls(g,.05);assert.deepEqual([a.faceX,a.faceY],old,'hover retains heading');}});


test('all seven expanded rooms have twenty drawables, mirrored doors and an unobstructed customer route',()=>{
 const {g,p}=setup();enter(g,p);
 for(const shop of ALLEY_SHOPS.filter(s=>s.id!=='ollivanders')){
  const assets=alleyShopAssets(shop), props=ALLEY_SHOP_ROOMS[shop.id].props;
  assert.equal(assets.length,20,shop.id);
  assert.equal(new Set(assets.map(a=>a.id)).size,20,shop.id);
  for(const prop of props.filter(a=>a.surface)){
   assert.ok(props.some(parent=>parent.id===prop.surface&&!parent.surface),shop.id+' '+prop.id);
  }
  for(let x=140;x>=22;x-=2){
   const point=mirroredShopPoint(shop,{x,y:12});
   assert.equal(alleyBlocked(g,point.x,point.y),false,shop.id+' walkway '+x);
  }
  const wall=mirroredShopPoint(shop,{x:108,y:42});
  assert.ok(alleyBlocked(g,wall.x,wall.y),shop.id+' wall');
  Object.assign(p,mirroredShopPoint(shop,{x:137,y:12}));
  assert.equal(shopCutawayOpen(shop,[p]),false,shop.id+' storefront');
  for(let step=0;step<12;step++)g.update(.05,{keyboard:{x:shop.x<8000?-1:1}});
  assert.equal(shopCutawayOpen(shop,[p]),true,shop.id+' walk-in');
  assert.ok(interactAlley(g,p),shop.id+' trade');
  p.ui=null;
 }
});
