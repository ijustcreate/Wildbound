import test from 'node:test';
import assert from 'node:assert/strict';
import {KEEPER_ANTLER_SIDES,paintKeeperItem,keeperBand,keeperHeadgear} from '../src/keeper-gear-art.mjs';
import {ITEMS} from '../src/items.mjs';
import {getNpcQuestConfig} from '../src/npc-quest-data.mjs';
import {drawQuestNpc} from '../src/npc-quests.mjs';
const recorder=()=>{const pixels=new Map();return {pixels,fillStyle:'',fillRect(x,y,w,h){for(let yy=Math.round(y);yy<y+h;yy++)for(let xx=Math.round(x);xx<x+w;xx++)pixels.set(xx+','+yy,this.fillStyle);}};};
test('Keeper helm has exactly two temple antlers, with no third central stem',()=>{
 assert.deepEqual(KEEPER_ANTLER_SIDES,[-1,1]);const c=recorder();paintKeeperItem(c,'keeper_crown');
 const tips=[...c.pixels.keys()].map(key=>key.split(',').map(Number)).filter(([,y])=>y<16);
 assert.ok(tips.some(([x])=>x<12));assert.ok(tips.some(([x])=>x>12));
 assert.ok(tips.every(([x,y])=>Math.abs(x-12)>=3&&y>=9),'Short antlers stay at the temples and leave the center open');
});
test('open Keeper circlet leaves the animated face untouched in every direction',()=>{
 for(let d=0;d<8;d++){
  const c=recorder();assert.equal(keeperHeadgear(c,'keeper_crown',{x:0,y:0},d),true);
  assert.ok([...c.pixels.keys()].every(key=>Number(key.split(',')[1])<-3));
  assert.ok(![...c.pixels.values()].includes('#c9c8b8'));
 }
});
test('existing reward ID is now an actual neck amulet with a chain and pendant',()=>{
 assert.equal(ITEMS.keeper_band.name,'Amulet of Open Doors');assert.equal(ITEMS.keeper_band.slot,'neck');assert.ok(ITEMS.keeper_band.questReward);assert.match(ITEMS.keeper_band.description,/pendant.*chain/);
 assert.equal(getNpcQuestConfig().stages.at(-1).reward,'keeper_band');assert.ok(getNpcQuestConfig().stages.at(-1).branches.every(b=>b.completion.includes('amulet')));
 const c=recorder();paintKeeperItem(c,'keeper_band');assert.ok(c.pixels.has('5,2'));assert.ok(c.pixels.has('10,16'));
 const rear=recorder();keeperBand(rear,'keeper_band',{x:0,y:0},4);assert.ok(![...rear.pixels.values()].includes('#40cbe6'));
});
test('Keeper world draw selects the humanoid rig even for existing NPC saves',()=>{
 let actor;const c={save(){},restore(){},fillText(){},fillRect(){}};
 drawQuestNpc(c,{time:0},{x:20,y:20,npcId:'rowan'},{draw(_c,a){actor=a;}});assert.equal(actor.sprite,'player');assert.equal(actor.equipment.neck,'keeper_band');
});
