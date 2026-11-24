import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/core.mjs';
import {enterWildLands} from '../src/wild-lands.mjs';
import {alleyBlocked,alleyGate,alleyPrompt,interactAlley} from '../src/diagon-alley.mjs';
import {LOCKSMITH_DOOR_ROW,LOCKSMITH_DOORS,LOCKSMITH_SHOP} from '../src/diagon-locksmith.mjs';
import {leaveTrainTest} from '../src/train-test.mjs';
import {merchantAction,merchantRows} from '../src/traveling-merchant.mjs';
import {give} from '../src/items.mjs';
import {WRONG_TURN_KEY,WRONG_TURN_KEY_OFFER} from '../src/wrong-turn-key.mjs';
import {saveSession,restoreSession} from '../src/session.mjs';
import {tickWrongTurnDoors} from '../src/wrong-turn-doors.mjs';
import {WRONG_TURN_DESTINATIONS} from '../src/wrong-turn-travel.mjs';

const rowY=LOCKSMITH_SHOP.y+LOCKSMITH_DOOR_ROW.y;
const doorCenter=door=>({x:LOCKSMITH_SHOP.x+LOCKSMITH_DOOR_ROW.x+door.offset,y:rowY});
const count=p=>p.inventory.reduce((n,i)=>n+(i?.type===WRONG_TURN_KEY?i.qty:0),0);

function setup(persistent=true){
 const g=new Game(()=>.5),original=g.addPlayer('keyboard','Key buyer');
 g.phase='play';g.openingBoard=false;g.persist=()=>{};g.onSound=()=>{};original.coins=200;
 assert.ok(enterWildLands(g,{persistent}).ok);
 const p=g.players[0],t=g.trainTest,gate=alleyGate(g);t.preparing=false;
 Object.assign(p,{x:gate.x,y:gate.y+57});p.equipment.hand1='starter_wand';
 assert.ok(interactAlley(g,p));t.time+=1;assert.ok(interactAlley(g,p));
 assert.equal(t.design.activeRoom,'diagon');t.noticeUntil=0;
 return {g,p,t,original};
}

function openStock(g,p){
 Object.assign(p,{x:LOCKSMITH_SHOP.x,y:LOCKSMITH_SHOP.y+28});p.ui=null;
 assert.ok(interactAlley(g,p));assert.equal(p.ui.alleyShop,LOCKSMITH_SHOP.id);
}

function buyKey(g,p){
 const row=merchantRows(g,p).find(r=>r.item.type===WRONG_TURN_KEY);
 assert.equal(row.price,WRONG_TURN_KEY_OFFER[1]);
 merchantAction(g,p,`select:${row.index}`);merchantAction(g,p,'use');
}

test('an old locksmith inventory learns the new offer and stocks repeat single-key purchases',()=>{
 const {g,p,t}=setup();openStock(g,p);
 const merchant=t.alleyMerchants[LOCKSMITH_SHOP.id];
 merchant.stock=merchant.stock.filter(r=>r.item.type!==WRONG_TURN_KEY);
 openStock(g,p);openStock(g,p);
 assert.equal(merchant.stock.filter(r=>r.item.type===WRONG_TURN_KEY).length,1);
 buyKey(g,p);buyKey(g,p);
 assert.equal(count(p),2);assert.equal(p.coins,200-2*WRONG_TURN_KEY_OFFER[1]);
 assert.ok(merchantRows(g,p).some(r=>r.item.type==='car_key'));
});

for(const door of LOCKSMITH_DOORS)test(door.name+' unlocks once and warps only when you walk through',()=>{
 const {g,p,t}=setup();const point=doorCenter(door);
 Object.assign(p,{x:point.x,y:rowY+22});
 assert.match(alleyPrompt(g,p),/MYSTERY KEY REQUIRED/);
 assert.ok(interactAlley(g,p));assert.ok(alleyBlocked(g,point.x,point.y,8));
 assert.ok(give(p.inventory,WRONG_TURN_KEY,2));
 const beforeSerial=g.portalTransition.serial;
 g.update(.02,{keyboard:{interact:true}});
 assert.equal(count(p),1);assert.equal(g.portalTransition.serial,beforeSerial);
 assert.equal(t.wrongTurnDoors[door.id],true);
 assert.equal(alleyBlocked(g,point.x,point.y,8),false);
 for(const other of LOCKSMITH_DOORS.filter(option=>option!==door)){
  const otherPoint=doorCenter(other);assert.ok(alleyBlocked(g,otherPoint.x,otherPoint.y,8));
 }
 g.update(.02,{keyboard:{}});g.update(.02,{keyboard:{interact:true}});
 assert.equal(count(p),1);assert.equal(g.portalTransition.serial,beforeSerial);
 g.random=()=>0;
 for(let i=0;i<30&&g.portalTransition.serial===beforeSerial;i++)g.update(.02,{keyboard:{y:-1}});
 assert.notEqual(g.portalTransition.serial,beforeSerial);
 assert.equal(t.wrongTurnDoors[door.id],undefined);assert.equal(count(p),1);
 assert.notEqual(t.design.activeRoom,'diagon');
});

test('open doors survive checkpoints and failed arrivals keep the paid doorway usable',()=>{
 const {g,p,t}=setup(),door=LOCKSMITH_DOORS[1],point=doorCenter(door);
 Object.assign(p,{x:point.x,y:rowY+23});give(p.inventory,WRONG_TURN_KEY,1);interactAlley(g,p);
 const loaded=restoreSession(JSON.parse(JSON.stringify(saveSession(g))));
 assert.equal(loaded.trainTest.wrongTurnDoors[door.id],true);
 assert.equal(count(loaded.players[0]),0);
 p.y=rowY+5;tickWrongTurnDoors(g,()=>{throw Error('Do not travel before crossing');});
 p.y=rowY-3;let attempts=0;
 assert.equal(tickWrongTurnDoors(g,()=>{attempts++;return {ok:false,message:'Blocked arrival'};}),false);
 assert.equal(attempts,1);assert.equal(t.wrongTurnDoors[door.id],true);assert.equal(count(p),0);
 assert.equal(t.notice,'Blocked arrival');
});

test('returning from preview carries back unused keys and keeps the cost of both purchases',()=>{
 const {g,p,original}=setup(false);openStock(g,p);buyKey(g,p);buyKey(g,p);
 const point=doorCenter(LOCKSMITH_DOORS[0]);Object.assign(p,{x:point.x,y:rowY+23,ui:null});interactAlley(g,p);
 leaveTrainTest(g);assert.equal(count(original),1);assert.equal(original.coins,200-2*WRONG_TURN_KEY_OFFER[1]);
});

test('Wrong Turn offers thirteen destination categories',()=>{
 assert.equal(WRONG_TURN_DESTINATIONS.length,13);
 assert.equal(new Set(WRONG_TURN_DESTINATIONS).size,13);
});
